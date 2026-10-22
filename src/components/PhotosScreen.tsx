import { useEffect, useMemo } from "react";
import Image from "next/image";
import Button, { buttonClasses } from "@/src/components/ui/Button";
import Screen, { Hint, ScreenHeader } from "@/src/components/ui/Screen";
import { MAX_PHOTOS } from "@/src/hooks/useInventoryDraft";
import { t } from "@/src/lib/strings";

type PhotosScreenProps = {
  photos: File[];
  processingPhotos: boolean;
  onAddPhotos: (files: File[]) => void;
  onRemovePhoto: (index: number) => void;
  onSubmit: () => void;
  onBack: () => void;
};

export default function PhotosScreen({
  photos,
  processingPhotos,
  onAddPhotos,
  onRemovePhoto,
  onSubmit,
  onBack,
}: PhotosScreenProps) {
  // one object URL per photo, revoked when photos change (avoids memory leaks on mobile)
  const previewUrls = useMemo(() => photos.map((p) => URL.createObjectURL(p)), [photos]);
  useEffect(() => () => previewUrls.forEach((u) => URL.revokeObjectURL(u)), [previewUrls]);

  const full = photos.length >= MAX_PHOTOS;
  const canTakePhoto = !processingPhotos && !full;

  return (
    <Screen
      header={
        <ScreenHeader
          title={t.photos.title}
          onBack={onBack}
          backDisabled={processingPhotos}
          step={{ current: 3, total: 3 }}
        />
      }
      footer={
        <>
          {photos.length === 0 && !processingPhotos && <Hint>{t.photos.needPhoto}</Hint>}
          <Button variant="success" fullWidth onClick={onSubmit} disabled={processingPhotos || photos.length === 0}>
            {processingPhotos ? t.photos.processing : t.photos.send}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4 p-4">
        <p className="text-lg font-semibold text-ink text-center">{t.photos.instructions}</p>

        <div className="relative w-full aspect-[4/3]">
          <Image src="/help.jpeg" alt={t.photos.helpAlt} fill className="object-contain" />
        </div>

        <label
          className={`${buttonClasses({ variant: "secondary", fullWidth: true })} ${
            canTakePhoto ? "cursor-pointer" : "opacity-40 pointer-events-none"
          }`}
        >
          {t.photos.takePhoto(photos.length, MAX_PHOTOS)}
          <input
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            disabled={!canTakePhoto}
            className="hidden"
            onChange={(e) => {
              onAddPhotos(Array.from(e.target.files ?? []));
              // allow picking the same file again
              e.target.value = "";
            }}
          />
        </label>

        {photos.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {previewUrls.map((url, i) => (
              <div key={url} className="flex flex-col gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element -- local blob: previews, not optimizable by next/image */}
                <img
                  src={url}
                  alt={t.photos.photoAlt(i + 1)}
                  className="w-full aspect-square object-cover rounded-lg border border-line"
                />
                <Button variant="danger" size="sm" onClick={() => onRemovePhoto(i)} disabled={processingPhotos}>
                  {t.photos.remove}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Screen>
  );
}
