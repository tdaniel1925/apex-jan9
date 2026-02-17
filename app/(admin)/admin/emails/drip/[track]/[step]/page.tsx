// Edit drip email template

import { requireAdmin } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import { newcomerTrack, licensedAgentTrack } from "@/lib/email/drip-content";
import { db } from "@/lib/db/client";
import { emailTemplates } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { DripEmailEditor } from "@/components/admin/drip-email-editor";

type PageProps = {
  params: Promise<{
    track: string;
    step: string;
  }>;
};

async function saveEmailTemplate(formData: FormData) {
  "use server";

  const admin = await requireAdmin();
  const track = formData.get("track") as string;
  const step = parseInt(formData.get("step") as string);
  const subject = formData.get("subject") as string;
  const previewText = formData.get("previewText") as string;
  const heading = formData.get("heading") as string;
  const paragraphsJson = formData.get("paragraphs") as string;
  const tipsJson = formData.get("tips") as string;
  const ctaJson = formData.get("callToAction") as string;

  const templateType = track === "newcomer" ? "drip_newcomer" : "drip_licensed";

  try {
    const paragraphs = JSON.parse(paragraphsJson);
    const tips = tipsJson ? JSON.parse(tipsJson) : null;
    const callToAction = ctaJson ? JSON.parse(ctaJson) : null;

    // Check if template already exists
    const [existing] = await db
      .select()
      .from(emailTemplates)
      .where(
        and(
          eq(emailTemplates.templateType, templateType),
          eq(emailTemplates.step, step)
        )
      )
      .limit(1);

    if (existing) {
      // Update existing
      await db
        .update(emailTemplates)
        .set({
          subject,
          previewText,
          heading,
          paragraphs,
          tips,
          callToAction,
          updatedBy: admin.id,
          updatedAt: new Date(),
        })
        .where(eq(emailTemplates.id, existing.id));
    } else {
      // Create new
      await db.insert(emailTemplates).values({
        templateType,
        step,
        subject,
        previewText,
        heading,
        paragraphs,
        tips,
        callToAction,
        updatedBy: admin.id,
      });
    }

    revalidatePath("/admin/emails");
    revalidatePath(`/admin/emails/drip/${track}/${step}`);

    return redirect("/admin/emails?saved=true");
  } catch (error) {
    console.error("Failed to save email template:", error);
    throw error;
  }
}

export default async function EditDripEmailPage({ params }: PageProps) {
  const admin = await requireAdmin();
  const { track, step: stepStr } = await params;
  const step = parseInt(stepStr);

  if (!["newcomer", "licensed"].includes(track) || step < 1 || step > 20) {
    notFound();
  }

  // Get default content
  const defaultContent = track === "newcomer"
    ? newcomerTrack[step - 1]
    : licensedAgentTrack[step - 1];

  if (!defaultContent) {
    notFound();
  }

  // Check for custom override
  const templateType = track === "newcomer" ? "drip_newcomer" : "drip_licensed";
  const [customTemplate] = await db
    .select()
    .from(emailTemplates)
    .where(
      and(
        eq(emailTemplates.templateType, templateType),
        eq(emailTemplates.step, step)
      )
    )
    .limit(1);

  // Use custom if exists, otherwise use default
  const currentContent = customTemplate
    ? {
        step,
        subject: customTemplate.subject,
        previewText: customTemplate.previewText,
        content: {
          heading: customTemplate.heading,
          paragraphs: customTemplate.paragraphs as string[],
          tips: customTemplate.tips as string[] | undefined,
          callToAction: customTemplate.callToAction as { text: string; url: string } | undefined,
        },
      }
    : defaultContent;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Edit {track === "newcomer" ? "Newcomer" : "Licensed Agent"} Email #{step}
          </h1>
          <p className="text-muted-foreground mt-1">
            {currentContent.subject}
          </p>
        </div>
        <a
          href="/admin/emails"
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          ← Back to All Emails
        </a>
      </div>

      {/* Editor */}
      <DripEmailEditor
        track={track}
        step={step}
        defaultContent={currentContent}
        isCustomized={!!customTemplate}
        saveAction={saveEmailTemplate}
      />
    </div>
  );
}
