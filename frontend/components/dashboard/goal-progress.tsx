'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Target, TrendingDown, AlertCircle } from "lucide-react";

export function GoalProgressSection() {
  // Mock data - replace with API call
  const goals = [
    {
      id: 1,
      title: "Reduce Carbon Emissions",
      target: "50% reduction by 2030",
      current: "25% reduction achieved",
      progress: 50,
      status: "on_track",
      timeRemaining: "4.5 years",
    },
    {
      id: 2,
      title: "Renewable Energy",
      target: "50% of energy from renewables",
      current: "32% renewable",
      progress: 64,
      status: "on_track",
      timeRemaining: "2 years",
    },
    {
      id: 3,
      title: "Water Reduction",
      target: "30% reduction by 2027",
      current: "8% reduction achieved",
      progress: 27,
      status: "at_risk",
      timeRemaining: "1.5 years",
    },
    {
      id: 4,
      title: "Waste to Zero",
      target: "85% waste diversion by 2025",
      current: "62% waste diversion",
      progress: 73,
      status: "on_track",
      timeRemaining: "6 months",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "on_track":
        return "success";
      case "at_risk":
        return "warning";
      case "behind":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getProgressBarColor = (status: string) => {
    switch (status) {
      case "on_track":
        return "bg-gradient-to-r from-green-500 to-green-600";
      case "at_risk":
        return "bg-gradient-to-r from-amber-500 to-amber-600";
      case "behind":
        return "bg-gradient-to-r from-red-500 to-red-600";
      default:
        return "bg-primary";
    }
  };

  return (
    <Card className="border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Goal Progress Tracking
            </CardTitle>
            <CardDescription className="mt-1">
              Track progress toward your sustainability targets
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {goals.map((goal) => (
            <div key={goal.id} className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-foreground">{goal.title}</h4>
                    <Badge variant={getStatusColor(goal.status)} className="text-xs">
                      {goal.status === "on_track"
                        ? "On Track"
                        : goal.status === "at_risk"
                        ? "At Risk"
                        : "Behind"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{goal.target}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-lg font-bold text-foreground">{goal.progress}%</div>
                  <div className="text-xs text-muted-foreground">{goal.timeRemaining} left</div>
                </div>
              </div>
              
              <div className="space-y-1.5">
                <div className="w-full bg-secondary rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-3 rounded-full transition-all duration-500 ${getProgressBarColor(goal.status)}`}
                    style={{ width: `${goal.progress}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{goal.current}</span>
                </p>
              </div>

              {goal.status === "at_risk" && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-warning/10 border border-warning/20">
                  <AlertCircle className="h-4 w-4 text-warning flex-shrink-0" />
                  <p className="text-xs text-warning-foreground">
                    Increase pace by {Math.ceil(goal.progress * 1.5) - goal.progress}% to stay on target
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 pt-6 border-t border-border">
          <h4 className="font-semibold text-sm text-foreground mb-3">Key Insights</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-primary" />
              3 out of 4 goals on track or above target
            </li>
            <li className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-warning" />
              Water reduction needs attention in next 6 months
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
