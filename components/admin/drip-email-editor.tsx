"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { DripEmail } from "@/lib/email/drip-content";

interface DripEmailEditorProps {
  track: string;
  step: number;
  defaultContent: DripEmail;
  isCustomized: boolean;
  saveAction: (formData: FormData) => Promise<void>;
}

export function DripEmailEditor({
  track,
  step,
  defaultContent,
  isCustomized,
  saveAction,
}: DripEmailEditorProps) {
  const [subject, setSubject] = useState(defaultContent.subject);
  const [previewText, setPreviewText] = useState(defaultContent.previewText);
  const [heading, setHeading] = useState(defaultContent.content.heading);
  const [paragraphs, setParagraphs] = useState<string[]>(
    defaultContent.content.paragraphs
  );
  const [tips, setTips] = useState<string[]>(
    defaultContent.content.tips || []
  );
  const [cta, setCta] = useState(
    defaultContent.content.callToAction || { text: "", url: "" }
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleAddParagraph = () => {
    setParagraphs([...paragraphs, ""]);
  };

  const handleRemoveParagraph = (index: number) => {
    setParagraphs(paragraphs.filter((_, i) => i !== index));
  };

  const handleAddTip = () => {
    setTips([...tips, ""]);
  };

  const handleRemoveTip = (index: number) => {
    setTips(tips.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const formData = new FormData();
      formData.append("track", track);
      formData.append("step", step.toString());
      formData.append("subject", subject);
      formData.append("previewText", previewText);
      formData.append("heading", heading);
      formData.append("paragraphs", JSON.stringify(paragraphs.filter((p) => p.trim())));
      formData.append("tips", JSON.stringify(tips.filter((t) => t.trim())));
      formData.append(
        "callToAction",
        cta.text && cta.url ? JSON.stringify(cta) : ""
      );

      await saveAction(formData);
    } catch (error) {
      console.error("Save failed:", error);
      alert("Failed to save. Please try again.");
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {isCustomized && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900">
            <strong>Note:</strong> This email has been customized. The original
            default content can be restored by clearing all fields and saving.
          </p>
        </div>
      )}

      <div className="bg-white rounded-lg border p-6 space-y-6">
        {/* Subject */}
        <div>
          <Label htmlFor="subject">Email Subject</Label>
          <Input
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Enter email subject..."
            required
            className="mt-1"
          />
        </div>

        {/* Preview Text */}
        <div>
          <Label htmlFor="previewText">Preview Text</Label>
          <Input
            id="previewText"
            value={previewText}
            onChange={(e) => setPreviewText(e.target.value)}
            placeholder="Text shown in email preview..."
            required
            className="mt-1"
          />
          <p className="text-xs text-muted-foreground mt-1">
            This appears in the inbox before opening the email
          </p>
        </div>

        {/* Heading */}
        <div>
          <Label htmlFor="heading">Email Heading</Label>
          <Input
            id="heading"
            value={heading}
            onChange={(e) => setHeading(e.target.value)}
            placeholder="Main heading in email body..."
            required
            className="mt-1"
          />
        </div>

        {/* Paragraphs */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label>Content Paragraphs</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddParagraph}
            >
              + Add Paragraph
            </Button>
          </div>
          <div className="space-y-3">
            {paragraphs.map((paragraph, index) => (
              <div key={index} className="flex gap-2">
                <Textarea
                  value={paragraph}
                  onChange={(e) => {
                    const newParagraphs = [...paragraphs];
                    newParagraphs[index] = e.target.value;
                    setParagraphs(newParagraphs);
                  }}
                  placeholder={`Paragraph ${index + 1}...`}
                  rows={3}
                  className="flex-1"
                />
                {paragraphs.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveParagraph(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    Remove
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Tips/Bullets */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div>
              <Label>Key Takeaways / Tips (Optional)</Label>
              <p className="text-xs text-muted-foreground">
                Displayed as bullet points in the email
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddTip}
            >
              + Add Tip
            </Button>
          </div>
          {tips.length > 0 && (
            <div className="space-y-2">
              {tips.map((tip, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={tip}
                    onChange={(e) => {
                      const newTips = [...tips];
                      newTips[index] = e.target.value;
                      setTips(newTips);
                    }}
                    placeholder={`Tip ${index + 1}...`}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveTip(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Call to Action */}
        <div className="border-t pt-6">
          <Label className="mb-3 block">Call to Action Button (Optional)</Label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="ctaText" className="text-sm text-muted-foreground">
                Button Text
              </Label>
              <Input
                id="ctaText"
                value={cta.text}
                onChange={(e) => setCta({ ...cta, text: e.target.value })}
                placeholder="Access Dashboard"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="ctaUrl" className="text-sm text-muted-foreground">
                Button URL
              </Label>
              <Input
                id="ctaUrl"
                value={cta.url}
                onChange={(e) => setCta({ ...cta, url: e.target.value })}
                placeholder="https://theapexway.net/dashboard"
                className="mt-1"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <a
          href="/admin/emails"
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          Cancel
        </a>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
