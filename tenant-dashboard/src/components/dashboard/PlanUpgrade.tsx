"use client";

import React, { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTenant } from "@/hooks/useTenant";
import { TrendingUp, Crown, Zap, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlanUpgradeProps {
  className?: string;
}

export const PlanUpgrade = memo(function PlanUpgrade({ className }: PlanUpgradeProps) {
  const { data: tenant } = useTenant();

  // Don't show upgrade card for enterprise plans
  if (!tenant || tenant.plan?.tier === "enterprise") {
    return null;
  }

  const handleUpgradeClick = () => {
    window.location.href = "/billing/subscription";
  };

  const getUpgradeContent = () => {
    const currentTier = tenant.plan?.tier || "free";
    
    switch (currentTier) {
      case "free":
        return {
          title: "Unlock Pro Features",
          description: "Get unlimited workspaces, advanced analytics, and priority support",
          icon: <Crown className="h-5 w-5 text-yellow-600" />,
          buttonText: "Upgrade to Pro",
          features: ["Unlimited workspaces", "Advanced analytics", "Priority support"],
          gradient: "from-yellow-500/10 to-orange-500/10",
          borderColor: "border-yellow-200",
        };
      case "pro":
        return {
          title: "Scale with Enterprise",
          description: "Advanced security, custom integrations, and dedicated support",
          icon: <Star className="h-5 w-5 text-purple-600" />,
          buttonText: "Upgrade to Enterprise",
          features: ["Advanced security", "Custom integrations", "Dedicated support"],
          gradient: "from-purple-500/10 to-pink-500/10",
          borderColor: "border-purple-200",
        };
      default:
        return {
          title: "Upgrade Your Plan",
          description: "Get more features and higher limits",
          icon: <TrendingUp className="h-5 w-5 text-primary" />,
          buttonText: "Upgrade Now",
          features: ["More features", "Higher limits"],
          gradient: "from-primary/5 to-transparent",
          borderColor: "border-primary/20",
        };
    }
  };

  const content = getUpgradeContent();

  return (
    <Card className={cn(
      "relative overflow-hidden",
      content.borderColor,
      `bg-gradient-to-r ${content.gradient}`,
      className
    )}>
      <CardContent className="flex items-center justify-between p-6">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 rounded-full bg-white/80 flex items-center justify-center shadow-sm">
            {content.icon}
          </div>
          <div className="space-y-1">
            <h3 className="font-medium text-gray-900">{content.title}</h3>
            <p className="text-sm text-gray-600">{content.description}</p>
            <div className="flex items-center space-x-2 mt-2">
              {content.features.map((feature, index) => (
                <Badge 
                  key={index}
                  variant="secondary" 
                  className="text-xs bg-white/50"
                >
                  <Zap className="h-3 w-3 mr-1" />
                  {feature}
                </Badge>
              ))}
            </div>
          </div>
        </div>
        <Button 
          onClick={handleUpgradeClick}
          className="shrink-0"
        >
          {content.buttonText}
        </Button>
      </CardContent>
    </Card>
  );
});

PlanUpgrade.displayName = "PlanUpgrade";