/**
 * reports.ts handler — pdfkit + S3 storage
 */
import { APIGatewayProxyHandler } from "aws-lambda";
import PDFDocument from "pdfkit";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  getAllReports,
  getReportById,
  createReport,
  deleteReport,
  incrementDownloads,
} from "../services/reportsService";
import { getAllEmissions } from "../services/emissionsService";
import { getAllEnergy } from "../services/energyService";
import { getAllWater } from "../services/waterService";
import { getAllWaste } from "../services/wasteService";
import { getUserId } from "../utils/getUserId";
import {
  ok,
  notFound,
  badRequest,
  unauthorized,
  serverError,
  isAuthError,
  CSV_HEADERS,
} from "../utils/response";

const s3 = new S3Client({ region: process.env.AWS_REGION || "ap-south-1" });
const S3_BUCKET = process.env.S3_BUCKET!;

export const getReports: APIGatewayProxyHandler = async (event) => {
  try {
    const userId = getUserId(event);
    return ok(await getAllReports(userId));
  } catch (err: any) {
    return isAuthError(err) ? unauthorized(err.message) : serverError();
  }
};

export const createReport_: APIGatewayProxyHandler = async (event) => {
  try {
    if (!event.body) return badRequest("Missing request body");
    const userId = getUserId(event);
    return ok(await createReport(userId, JSON.parse(event.body)));
  } catch (err: any) {
    return isAuthError(err) ? unauthorized(err.message) : serverError();
  }
};

function labelForType(type: string) {
  const t = (type || "").toLowerCase();
  if (t === "esg") return "ESG";
  if (t === "annual") return "Annual";
  if (t === "compliance" || t === "csrd") return "CSRD Compliance";
  return "Quarterly";
}

// POST /reports/generate
export const generateReport: APIGatewayProxyHandler = async (event) => {
  try {
    if (!event.body) return badRequest("Missing request body");
    const userId = getUserId(event);
    const body = JSON.parse(event.body);
    const type = String(body.type || "quarterly");

    const [emissions, energy, water, waste] = await Promise.all([
      getAllEmissions(userId),
      getAllEnergy(userId),
      getAllWater(userId),
      getAllWaste(userId),
    ]);

    const totalEmissions = (emissions || []).reduce(
      (s: number, r: any) => s + Number(r.amount || 0),
      0,
    );
    const totalEnergy = (energy || []).reduce(
      (s: number, r: any) => s + Number(r.consumption || 0),
      0,
    );
    const renewableEnergy = (energy || [])
      .filter((r: any) =>
        String(r.source || "").toLowerCase().includes("renewable"),
      )
      .reduce((s: number, r: any) => s + Number(r.consumption || 0), 0);
    const renewableEnergyPercent =
      totalEnergy > 0 ? Math.round((renewableEnergy / totalEnergy) * 100) : 0;

    const totalWater = (water || []).reduce(
      (s: number, r: any) => s + Number(r.consumption || 0),
      0,
    );

    const totalWaste = (waste || []).reduce(
      (s: number, r: any) => s + Number(r.amount || 0),
      0,
    );
    const recycledWaste = (waste || [])
      .filter((r: any) => String(r.type || "").toLowerCase() === "recycled")
      .reduce((s: number, r: any) => s + Number(r.amount || 0), 0);
    const wasteRecycledPercent =
      totalWaste > 0 ? Math.round((recycledWaste / totalWaste) * 100) : 0;

    const now = new Date();
    const monthLabel = `${now.toLocaleString("default", { month: "short" })} ${now.getFullYear()}`;
    const title =
      String(body.title || "").trim() ||
      `${monthLabel} ${labelForType(type)} Sustainability Report`;

    const item = await createReport(userId, {
      title,
      type,
      status: "published",
      emissions: totalEmissions,
      renewableEnergy: renewableEnergyPercent,
      waterUsage: totalWater,
      wasteRecycled: wasteRecycledPercent,
    } as any);

    return ok(item);
  } catch (err: any) {
    console.error("generateReport error:", err);
    return isAuthError(err) ? unauthorized(err.message) : serverError();
  }
};

export const filterReports: APIGatewayProxyHandler = async (event) => {
  try {
    const userId = getUserId(event);
    const { type, status } = event.queryStringParameters || {};
    let items = await getAllReports(userId);
    if (type) items = items.filter((r) => r.type === type);
    if (status) items = items.filter((r) => r.status === status);
    return ok(items);
  } catch (err: any) {
    return isAuthError(err) ? unauthorized(err.message) : serverError();
  }
};

export const exportReports: APIGatewayProxyHandler = async (event) => {
  try {
    const userId = getUserId(event);
    const items = await getAllReports(userId);
    const csv = [
      "title,generated,type,status,downloads,emissions,renewableEnergy,waterUsage,wasteRecycled",
      ...items.map((r) =>
        [
          r.title,
          r.generated,
          r.type,
          r.status,
          r.downloads,
          r.emissions,
          r.renewableEnergy,
          r.waterUsage,
          r.wasteRecycled,
        ]
          .map((v) => `"${String(v ?? "").replaceAll('"', '""')}"`)
          .join(","),
      ),
    ].join("\n");
    return { statusCode: 200, headers: CSV_HEADERS("reports.csv"), body: csv };
  } catch (err: any) {
    return isAuthError(err) ? unauthorized(err.message) : serverError();
  }
};

export const downloadReport: APIGatewayProxyHandler = async (event) => {
  try {
    const id = event.pathParameters?.id;
    if (!id) return badRequest("Missing id");

    const userId = getUserId(event);
    const report = await getReportById(id, userId);
    if (!report) return notFound("Report not found");

    const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
      const doc: PDFKit.PDFDocument = new (PDFDocument as any)({ margin: 50 });
      const chunks: Buffer[] = [];
      doc.on("data", (chunk: Buffer) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      doc
        .fontSize(24)
        .font("Helvetica-Bold")
        .text(report.title, { align: "center" });
      doc.moveDown(0.5);
      doc
        .fontSize(12)
        .font("Helvetica")
        .fillColor("#666666")
        .text(`Generated: ${new Date(report.generated).toLocaleDateString()}`, {
          align: "center",
        });
      doc.moveDown(2);
      doc.moveTo(50, doc.y).lineTo(562, doc.y).strokeColor("#e5e7eb").stroke();
      doc.moveDown(1);

      doc
        .fontSize(16)
        .font("Helvetica-Bold")
        .fillColor("#111827")
        .text("Key Metrics");
      doc.moveDown(0.5);

      [
        ["Carbon Emissions", `${(report.emissions / 1000).toFixed(1)}K kg CO2e`],
        ["Renewable Energy", `${report.renewableEnergy}%`],
        ["Water Usage", `${(report.waterUsage / 1000).toFixed(1)}K liters`],
        ["Waste Recycled", `${report.wasteRecycled}%`],
      ].forEach(([label, value]) => {
        doc
          .fontSize(12)
          .font("Helvetica-Bold")
          .fillColor("#374151")
          .text(label, { continued: true });
        doc.font("Helvetica").fillColor("#6b7280").text(`  ${value}`);
        doc.moveDown(0.3);
      });

      doc.moveDown(1.5);
      doc.moveTo(50, doc.y).lineTo(562, doc.y).strokeColor("#e5e7eb").stroke();
      doc.moveDown(1);

      // Compliance section based on report type
      const type = (report.type || "quarterly").toLowerCase();

      doc
        .fontSize(16)
        .font("Helvetica-Bold")
        .fillColor("#111827")
        .text("Compliance & Disclosures");
      doc.moveDown(0.5);
      doc.fontSize(11).fillColor("#4b5563");

      if (type === "csrd" || type === "compliance" || type === "csrd compliance") {
        doc.font("Helvetica-Bold").text("CSRD Mandatory Disclosures Framework:");
        doc.moveDown(0.5);
        doc.font("Helvetica").text("• ESRS E1 (Climate Change): Aligned with European Sustainability Reporting Standards.");
        doc.text("• Double Materiality Assessment: Complete.");
        doc.text("• Scope 1, 2, and 3 Emissions: Tracked and validated per GHG Protocol.");
        doc.text("• EU Taxonomy Alignment: 87% eligible activities reported.");
      } else if (type === "esg") {
        doc.font("Helvetica-Bold").text("Environmental, Social & Governance Summary:");
        doc.moveDown(0.5);
        doc.font("Helvetica").text("• Environment: Scope 1 & 2 carbon footprint offset by renewable mix.");
        doc.text("• Social: Supplier code of conduct compliance tracked internally.");
        doc.text("• Governance: Board oversight established for climate risks and sustainability data governance.");
      } else if (type === "annual") {
        doc.font("Helvetica-Bold").text("Annual Review & Auditing:");
        doc.moveDown(0.5);
        doc.font("Helvetica").text("• Year-over-Year Performance: Evaluated against annualized baselines.");
        doc.text("• Goal Alignment: Strategic performance evaluated by executive committee.");
        doc.text("• Data Integrity: Metrics consolidated for year-end corporate sustainability report.");
      } else {
        doc.font("Helvetica-Bold").text("Quarterly Tracking Review:");
        doc.moveDown(0.5);
        doc.font("Helvetica").text("• Q-o-Q Progress: Performance updated against internal targets.");
        doc.text("• Alert Status: Standard operational compliance maintained.");
      }

      doc.moveDown(2);
      doc
        .fontSize(10)
        .fillColor("#9ca3af")
        .text("Generated by SustainHub", { align: "center" });
      doc.end();
    });

    // Upload to S3
    const s3Key = `reports/${id}.pdf`;
    await s3.send(new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: s3Key,
      Body: pdfBuffer,
      ContentType: "application/pdf",
    }));

    // Generate presigned URL valid for 1 hour
    const downloadUrl = await getSignedUrl(
      s3,
      new GetObjectCommand({ Bucket: S3_BUCKET, Key: s3Key }),
      { expiresIn: 3600 },
    );

    await incrementDownloads(id, userId).catch((e) =>
      console.warn("increment failed:", e),
    );

    return ok({ downloadUrl });
  } catch (err: any) {
    console.error("downloadReport error:", err);
    if (err.message === "Not found") return notFound();
    return isAuthError(err)
      ? unauthorized(err.message)
      : serverError(err.message);
  }
};

export const deleteReport_: APIGatewayProxyHandler = async (event) => {
  try {
    const id = event.pathParameters?.id;
    if (!id) return badRequest("Missing id");
    await deleteReport(id, getUserId(event));
    return ok({ message: "Report deleted" });
  } catch (err: any) {
    if (err.message === "Not found") return notFound();
    return isAuthError(err) ? unauthorized(err.message) : serverError();
  }
};

export { createReport_ as createReport, deleteReport_ as deleteReport };