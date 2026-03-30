'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, Lightbulb, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export function RecommendedActionsSection() {
  // Mock data - replace with API call
  const recommendedActions = [
    {
      id: 1,
      title: "Optimize HVAC Schedule",
      description: "Current schedule runs 18 hours daily. Reducing to 14 hours could save 25% energy.",
      impact: "High",
      savings: "2,400 kg CO₂e/year",
      category: "Energy",
      priority: "high",
    },
    {
      id: 2,
      title: "Replace LED Lighting",
      description: "25% of building still uses incandescent. LED upgrade saves 40% energy per fixture.",
      impact: "Medium",
      savings: "1,800 kg CO₂e/year",
      category: "Energy",
      priority: "medium",
    },
    {
      id: 3,
      title: "Water Recycling System",
      description: "Implement greywater recycling in restrooms. Potential 30% reduction in water usage.",
      impact: "High",
      savings: "850 K liters/year",
      category: "Water",
      priority: "medium",
    },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
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

  return (
    <Card className="border-border/50 border-l-4 border-l-secondary/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-secondary" />
              Recommended Priority Actions
            </CardTitle>
            <CardDescription className="mt-1">
              AI-powered recommendations ranked by impact and ROI
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recommendedActions.map((action) => (
            <div
              key={action.id}
              className="border border-border/50 rounded-lg p-4 hover:border-secondary/30 transition-colors group"
            >
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-foreground">{action.title}</h4>
                    <Badge variant={getPriorityColor(action.priority)} className="text-xs">
                      {action.priority.charAt(0).toUpperCase() + action.priority.slice(1)} Priority
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{action.description}</p>
                </div>
                <TrendingUp className="h-5 w-5 text-secondary opacity-40 flex-shrink-0 group-hover:opacity-60 transition-opacity" />
              </div>
              <div className="flex flex-wrap items-center gap-4 mt-3 pt-3 border-t border-border/30">
                <div>
                  <span className="text-xs font-medium text-muted-foreground">Annual Savings: </span>
                  <span className="text-sm font-semibold text-secondary">{action.savings}</span>
                </div>
                <div>
                  <span className="text-xs font-medium text-muted-foreground">Impact: </span>
                  <span className="text-sm font-semibold text-foreground">{action.impact}</span>
                </div>
                <div className="ml-auto">
                  <Badge variant="outline" className="text-xs">
                    {action.category}
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
        <Button className="w-full mt-4" variant="secondary">
          View All Recommendations
        </Button>
      </CardContent>
    </Card>
  );
}
