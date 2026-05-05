"use client";

import "react-easy-crop/react-easy-crop.css";

import { useMutation } from "convex/react";
import { useCallback, useEffect, useRef, useState } from "react";
import Cropper, { type Area, type Point } from "react-easy-crop";
import { toast } from "sonner";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { getCroppedImageBlob, outputMimeForUpload } from "@/lib/image-crop";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

type TeamLogoCropDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageSrc: string | null;
  sourceMimeType: string;
  teamId: Id<"teams">;
  onUploaded?: () => void;
};

export function TeamLogoCropDialog({
  open,
  onOpenChange,
  imageSrc,
  sourceMimeType,
  teamId,
  onUploaded = () => {},
}: TeamLogoCropDialogProps) {
  const generateUrl = useMutation(api.mediaAssets.generateTeamLogoUploadUrl);
  const submitUpload = useMutation(api.mediaAssets.submitTeamLogoUpload);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const croppedAreaPixelsRef = useRef<Area | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    croppedAreaPixelsRef.current = null;
  }, [open, imageSrc]);

  const onCropComplete = useCallback((_area: Area, areaPixels: Area) => {
    croppedAreaPixelsRef.current = areaPixels;
  }, []);

  const handleApply = useCallback(async () => {
    if (!imageSrc) return;
    const pixels = croppedAreaPixelsRef.current;
    if (!pixels || pixels.width < 1 || pixels.height < 1) {
      toast.error("Adjust the crop and try again");
      return;
    }
    setBusy(true);
    try {
      const outMime = outputMimeForUpload(sourceMimeType);
      const blob = await getCroppedImageBlob(imageSrc, pixels, sourceMimeType);
      const { uploadUrl } = await generateUrl({ teamId });
      const res = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": outMime },
        body: blob,
      });
      if (!res.ok) {
        throw new Error("Upload failed");
      }
      const json = (await res.json()) as { storageId: string };
      await submitUpload({ teamId, storageId: json.storageId as Id<"_storage"> });
      toast.success("Logo submitted for review");
      onOpenChange(false);
      onUploaded();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not upload logo");
    } finally {
      setBusy(false);
    }
  }, [generateUrl, imageSrc, onOpenChange, onUploaded, sourceMimeType, submitUpload, teamId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg" className="p-0" footer={null} showCloseButton>
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>Position team logo</DialogTitle>
          <DialogDescription>
            Drag to move and zoom to frame the square that will be shown as your team avatar everywhere.
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="space-y-4 px-6">
          {imageSrc ? (
            <>
              <div className="relative h-[min(55vh,360px)] w-full overflow-hidden rounded-lg border border-border/60 bg-muted">
                <Cropper
                  key={imageSrc}
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  cropShape="rect"
                  showGrid={false}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-mono uppercase tracking-wider">Zoom</Label>
                <Slider min={1} max={3} step={0.02} value={[zoom]} onValueChange={(v) => setZoom(v[0] ?? 1)} />
              </div>
            </>
          ) : null}
        </DialogBody>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={busy}>
              Cancel
            </Button>
          </DialogClose>
          <Button type="button" disabled={busy || !imageSrc} onClick={() => void handleApply()}>
            Save logo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
