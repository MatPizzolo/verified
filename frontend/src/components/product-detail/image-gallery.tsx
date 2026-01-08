"use client"

import { useState } from "react"
import Image from "next/image"

interface ImageGalleryProps {
  images: string[]
  productName: string
}

export function ImageGallery({ images, productName }: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)

  // Use provided images or create placeholder variations
  const displayImages = images.length > 0 ? images : ["/placeholder.svg"]

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="aspect-square bg-neutral-100 rounded-xl overflow-hidden relative">
        <Image
          src={displayImages[selectedIndex] || "/placeholder.svg"}
          alt={productName}
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* Thumbnails */}
      {displayImages.length > 1 && (
        <div className="flex gap-3">
          {displayImages.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedIndex(index)}
              className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                selectedIndex === index ? "border-primary-500" : "border-transparent"
              }`}
            >
              <Image
                src={image || "/placeholder.svg"}
                alt={`${productName} view ${index + 1}`}
                width={80}
                height={80}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
