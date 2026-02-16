// SPEC: SPEC-WORKFLOWS > WF-4
// Profile edit form component

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateProfile } from "@/lib/actions";
import { toast } from "sonner";
import type { Distributor } from "@/lib/db/schema";

type ProfileFormProps = {
  distributor: Distributor;
};

export function ProfileForm({ distributor }: ProfileFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: distributor.firstName,
    lastName: distributor.lastName,
    phone: distributor.phone || "",
    bio: distributor.bio || "",
    businessName: distributor.businessName || "",
    displayPreference: distributor.displayPreference || "personal",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    // Basic validation
    const newErrors: Record<string, string> = {};
    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }
    if (formData.bio.length > 500) {
      newErrors.bio = "Bio must be 500 characters or less";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsLoading(false);
      return;
    }

    const result = await updateProfile({
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      phone: formData.phone.trim() || undefined,
      bio: formData.bio.trim() || undefined,
      businessName: formData.businessName.trim() || undefined,
      displayPreference: formData.displayPreference as "personal" | "business" | "both",
    });

    setIsLoading(false);

    if (result.success) {
      toast.success("Profile updated successfully!");
    } else {
      toast.error(result.error || "Failed to update profile");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            value={formData.firstName}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, firstName: e.target.value }))
            }
            disabled={isLoading}
          />
          {errors.firstName && (
            <p className="text-sm text-red-600">{errors.firstName}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            value={formData.lastName}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, lastName: e.target.value }))
            }
            disabled={isLoading}
          />
          {errors.lastName && (
            <p className="text-sm text-red-600">{errors.lastName}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={distributor.email}
          disabled
          className="bg-gray-100 dark:bg-gray-800"
        />
        <p className="text-sm text-muted-foreground">
          Contact support to change your email address
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone (optional)</Label>
        <Input
          id="phone"
          type="tel"
          value={formData.phone}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, phone: e.target.value }))
          }
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="businessName">Business Name (optional)</Label>
        <Input
          id="businessName"
          type="text"
          placeholder="Mike's Insurance Agency"
          value={formData.businessName}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, businessName: e.target.value }))
          }
          disabled={isLoading}
        />
        <p className="text-sm text-muted-foreground">
          Optional business name to display on your replicated site
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="displayPreference">Display Name On Site</Label>
        <Select
          value={formData.displayPreference}
          onValueChange={(value) =>
            setFormData((prev) => ({ ...prev, displayPreference: value as "personal" | "business" | "both" }))
          }
          disabled={isLoading}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="personal">
              Personal Name ({distributor.firstName} {distributor.lastName})
            </SelectItem>
            <SelectItem value="business" disabled={!formData.businessName}>
              Business Name Only
              {!formData.businessName && " (enter business name first)"}
            </SelectItem>
            <SelectItem value="both" disabled={!formData.businessName}>
              Both Names
              {!formData.businessName && " (enter business name first)"}
            </SelectItem>
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">
          Choose how your name appears on your replicated website
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          value={formData.bio}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, bio: e.target.value }))
          }
          disabled={isLoading}
          rows={4}
          maxLength={500}
        />
        <p className="text-sm text-muted-foreground">
          {formData.bio.length}/500 characters
        </p>
        {errors.bio && <p className="text-sm text-red-600">{errors.bio}</p>}
      </div>

      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Saving..." : "Save Changes"}
      </Button>
    </form>
  );
}
