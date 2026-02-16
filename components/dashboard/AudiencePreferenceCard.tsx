// SPEC: Audience Segmentation > Profile Settings
// Component for distributors to select target audience preference

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { updateTargetAudience } from "@/app/(dashboard)/dashboard/profile/actions";
import { CheckCircle2, Users, GraduationCap, Target } from "lucide-react";

interface AudiencePreferenceCardProps {
  currentPreference: "agents" | "newcomers" | "both";
}

type TargetAudience = "agents" | "newcomers" | "both";

interface AudienceOption {
  value: TargetAudience;
  icon: typeof Users;
  label: string;
  description: string;
  emoji: string;
}

const audienceOptions: AudienceOption[] = [
  {
    value: "agents",
    icon: Users,
    label: "Licensed Insurance Agents",
    description: "I recruit experienced agents looking for better rates and ownership",
    emoji: "👔",
  },
  {
    value: "newcomers",
    icon: GraduationCap,
    label: "People New to Insurance",
    description: "I help people start their insurance career from scratch",
    emoji: "🌟",
  },
  {
    value: "both",
    icon: Target,
    label: "Both",
    description: "I recruit anyone interested in the opportunity",
    emoji: "🎯",
  },
];

export function AudiencePreferenceCard({
  currentPreference,
}: AudiencePreferenceCardProps) {
  const [selected, setSelected] = useState<TargetAudience>(currentPreference);
  const [isSaving, setIsSaving] = useState(false);
  const hasChanged = selected !== currentPreference;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const result = await updateTargetAudience(selected);

      if (result.success) {
        toast.success("Audience preference updated successfully!");
      } else {
        toast.error(result.error || "Failed to update preference");
        // Revert on error
        setSelected(currentPreference);
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      setSelected(currentPreference);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold">Who Do You Recruit?</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Customize your replicated page for your target audience
        </p>
      </div>

      {/* Options */}
      <div className="grid grid-cols-1 gap-4">
        {audienceOptions.map((option) => {
          const Icon = option.icon;
          const isSelected = selected === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setSelected(option.value)}
              disabled={isSaving}
              className={`
                relative flex items-start gap-4 p-4 rounded-lg border-2 transition-all text-left
                ${
                  isSelected
                    ? "border-apex-navy bg-apex-navy/5"
                    : "border-gray-200 hover:border-gray-300 bg-white"
                }
                ${isSaving ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
              `}
            >
              {/* Icon/Emoji */}
              <div
                className={`
                flex items-center justify-center w-12 h-12 rounded-lg flex-shrink-0
                ${isSelected ? "bg-apex-navy text-white" : "bg-gray-100 text-gray-600"}
              `}
              >
                <span className="text-2xl">{option.emoji}</span>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4
                    className={`font-semibold ${isSelected ? "text-apex-navy" : "text-gray-900"}`}
                  >
                    {option.label}
                  </h4>
                  {isSelected && (
                    <CheckCircle2 className="w-5 h-5 text-apex-navy flex-shrink-0" />
                  )}
                </div>
                <p className="text-sm text-gray-600">{option.description}</p>
              </div>

              {/* Radio indicator */}
              <div className="flex-shrink-0 mt-1">
                <div
                  className={`
                  w-5 h-5 rounded-full border-2 flex items-center justify-center
                  ${isSelected ? "border-apex-navy" : "border-gray-300"}
                `}
                >
                  {isSelected && (
                    <div className="w-3 h-3 rounded-full bg-apex-navy" />
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Save Button */}
      {hasChanged && (
        <div className="flex items-center gap-3 pt-2">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-apex-navy hover:bg-apex-navy-dark"
          >
            {isSaving ? "Saving..." : "Save Preference"}
          </Button>
          <Button
            variant="outline"
            onClick={() => setSelected(currentPreference)}
            disabled={isSaving}
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}
