"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface ImageGalleryProps {
  images: string[];
}

const PLACEHOLDER = "/image-coming-soon.jpeg";

export function ImageGallery({ images: rawImages }: ImageGalleryProps) {
  const images = rawImages.filter((img) => img && !img.includes("placeholder") && !img.includes("coming-soon"));
  const displayImages = images.length > 0 ? images : [PLACEHOLDER];

  const [activeIdx, setActiveIdx] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);

  const goTo = (idx: number) => {
    setActiveIdx(Math.max(0, Math.min(idx, displayImages.length - 1)));
  };

  return (
    <div>
      {/* Main image */}
      <div
        className="relative rounded-lg border bg-muted/20 overflow-hidden cursor-pointer aspect-square flex items-center justify-center"
        onClick={() => setModalOpen(true)}
      >
        <img
          src={displayImages[activeIdx]}
          alt="Product"
          className="max-h-full max-w-full object-contain"
          onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER; }}
        />
        {displayImages.length > 1 && (
          <span className="absolute top-2 right-2 text-[10px] bg-black/50 text-white rounded-full px-2 py-0.5">
            {activeIdx + 1} / {displayImages.length}
          </span>
        )}
      </div>

      {/* Thumbnails */}
      {displayImages.length > 1 && (
        <div className="flex items-center gap-2 mt-3 overflow-x-auto">
          {displayImages.map((img, i) => (
            <button
              key={i}
              onClick={() => setActiveIdx(i)}
              className={`shrink-0 h-14 w-14 rounded-md border overflow-hidden transition-all ${
                i === activeIdx ? "border-primary ring-1 ring-primary/30" : "border-border/50 hover:border-border"
              }`}
            >
              <img src={img} alt="" className="h-full w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER; }} />
            </button>
          ))}
        </div>
      )}

      {/* Modal carousel */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-3xl p-0 bg-black/95 border-0">
          <div className="relative flex items-center justify-center min-h-[60vh]">
            <img
              src={displayImages[activeIdx]}
              alt="Product"
              className="max-h-[80vh] max-w-full object-contain"
              onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER; }}
            />

            {displayImages.length > 1 && (
              <>
                <button onClick={() => goTo(activeIdx - 1)} className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button onClick={() => goTo(activeIdx + 1)} className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
                  <ChevronRight className="h-5 w-5" />
                </button>
                <span className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-white/70">
                  {activeIdx + 1} / {displayImages.length}
                </span>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
