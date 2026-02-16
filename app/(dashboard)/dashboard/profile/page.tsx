// SPEC: SPEC-PAGES > Profile Page
// SPEC: SPEC-WORKFLOWS > WF-4, WF-5
// SPEC: SPEC-DEPENDENCY-MAP > FEATURE 4 > Profile Management
// Profile page with photo upload and form

import { requireDistributor } from "@/lib/auth";
import { ProfileForm } from "@/components/dashboard/profile-form";
import { PhotoUploadSection } from "@/components/dashboard/photo-upload-section";
import { PasswordChangeForm } from "@/components/dashboard/password-change-form";
import { AudiencePreferenceCard } from "@/components/dashboard/AudiencePreferenceCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { db } from "@/lib/db/client";
import { distributors } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export default async function ProfilePage() {
  const user = await requireDistributor();

  // Get full distributor record
  const [distributor] = await db
    .select()
    .from(distributors)
    .where(eq(distributors.id, user.id))
    .limit(1);

  if (!distributor) {
    throw new Error("Distributor not found");
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold">Profile Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your profile information and settings
        </p>
      </div>

      {/* Photo Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Photo</CardTitle>
        </CardHeader>
        <CardContent>
          <PhotoUploadSection
            currentPhotoUrl={distributor.photoUrl}
            distributorId={distributor.id}
            firstName={distributor.firstName}
            lastName={distributor.lastName}
          />
        </CardContent>
      </Card>

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileForm distributor={distributor} />
        </CardContent>
      </Card>

      {/* Target Audience Preference */}
      <Card>
        <CardHeader>
          <CardTitle>Target Audience</CardTitle>
        </CardHeader>
        <CardContent>
          <AudiencePreferenceCard
            currentPreference={distributor.targetAudience}
          />
        </CardContent>
      </Card>

      {/* Password Change */}
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
        </CardHeader>
        <CardContent>
          <PasswordChangeForm />
        </CardContent>
      </Card>
    </div>
  );
}
