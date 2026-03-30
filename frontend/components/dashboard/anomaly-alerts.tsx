'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, TrendingUp, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AnomalyAlertsSection() {
  // Mock data - replace with API call
  const alerts = [
    {
      id: 1,
      type: "emissions_spike",
      title: "Emissions Spike Detected",
      description: "Carbon emissions increased 35% compared to last month. Scope 2 emissions (electricity) primary driver.",
      severity: "high",
      timestamp: "2 hours ago",
      affectedArea: "Facility A",
      status: "active",
    },
    {
      id: 2,
      type: "goal_deviation",
      title: "Goal Deviation - Water Usage",
      description: "Water consumption 18% above target for Q2. Current trend indicates 25% overage by year-end.",
      severity: "medium",
      timestamp: "5 hours ago",
      affectedArea: "All Facilities",
      status: "active",
    },
    {
      id: 3,
      type: "compliance_risk",
      title: "Compliance Risk - CSRD Readiness",
      description: "Some ESG metrics missing for Q2 reporting. 72 hours to data collection deadline.",
      severity: "high",
      timestamp: "1 day ago",
      affectedArea: "Reporting",
      status: "pending_action",
    },
    {
      id: 4,
      type: "anomaly",
      title: "Unusual Energy Pattern",
      description: "Building B energy consumption 28% above historical average. Potential equipment malfunction.",
      severity: "medium",
      timestamp: "3 days ago",
      affectedArea: "Building B",
      status: "investigating",
    },
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "destructive";
      case "medium":
        return "warning";
      case "low":
        return "secondary";
      default:
        return "secondary";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <AlertCircle className="h-4 w-4 text-destructive animate-pulse-subtle" />;
      case "investigating":
        return <Clock className="h-4 w-4 text-warning" />;
      case "pending_action":
        return <AlertCircle className="h-4 w-4 text-warning" />;
      case "resolved":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      default:
        return null;
    }
  };

  const activeAlerts = alerts.filter(a => a.status !== "resolved");
  const resolvedAlerts = alerts.filter(a => a.status === "resolved");

  return (
    <Card className="border-border/50 border-l-4 border-l-destructive/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Anomaly Detection & Alerts
            </CardTitle>
            <CardDescription className="mt-1">
              Real-time monitoring for emissions spikes, goal deviations, and compliance risks
            </CardDescription>
          </div>
          {activeAlerts.length > 0 && (
            <Badge variant="destructive" className="text-base px-3 py-1">
              {activeAlerts.length} Active
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alerts.slice(0, 4).map((alert) => (
            <div
              key={alert.id}
              className={`border border-border/50 rounded-lg p-3 transition-colors ${
                alert.status === "resolved"
                  ? "bg-secondary/5 border-secondary/20"
                  : "hover:border-destructive/30"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                  <div className="mt-1">
                    {getStatusIcon(alert.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-sm text-foreground">{alert.title}</h4>
                      <Badge variant={getSeverityColor(alert.severity)} className="text-xs flex-shrink-0">
                        {alert.severity}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{alert.description}</p>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <Badge variant="outline">{alert.affectedArea}</Badge>
                      <span className="text-muted-foreground">{alert.timestamp}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <Button className="w-full mt-4" variant="outline">
          View All Alerts ({alerts.length})
        </Button>
      </CardContent>
    </Card>
  );
}
