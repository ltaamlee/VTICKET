import ImageUploader from "../ImageUploader";

export default function EventImagesSection({
    formData,
    setFormData,
    thumbnailFile,
    setThumbnailFile,
    bannerFile,
    setBannerFile,
    onAlert,
}) {
    return (
        <div className="grid grid-cols-[minmax(0,0.65fr)_minmax(0,1.35fr)] items-start gap-5 lg:col-span-2">
            <div className="max-w-[280px]">
                <ImageUploader
                    title="Ảnh thẻ sự kiện"
                    ratio="1:1"
                    recommendation="Khuyến nghị: 600 × 600 px"
                    file={thumbnailFile}
                    setFile={setThumbnailFile}
                    imageUrl={formData.thumbnailUrl}
                    setImageUrl={(value) =>
                        setFormData((prev) => ({
                            ...prev,
                            thumbnailUrl: value,
                        }))
                    }
                    onAlert={onAlert}
                />
            </div>

            <ImageUploader
                title="Ảnh banner"
                ratio="16:9"
                recommendation="Khuyến nghị: 1920 × 1080 px"
                file={bannerFile}
                setFile={setBannerFile}
                imageUrl={formData.bannerUrl}
                setImageUrl={(value) =>
                    setFormData((prev) => ({
                        ...prev,
                        bannerUrl: value,
                    }))
                }
                onAlert={onAlert}
            />
        </div>
    );
}
