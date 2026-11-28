import {
  User,
  Building2,
  Mail,
  Phone,
  MapPin,
  Globe,
} from "lucide-react";

export default function OrganizerBasicInfoForm({
  organizerType,
  setOrganizerType,
  organizationName,
  setOrganizationName,
  contactEmail,
  setContactEmail,
  contactPhone,
  setContactPhone,
  address,
  setAddress,
  website,
  setWebsite,
}) {
  return (
    <>
      {/* PHẦN 1: LOẠI HÌNH TỔ CHỨC */}
      <div className="mb-8">
        <label className="text-xs font-semibold uppercase text-gray-600 block mb-3">
          1. Chọn loại hình tổ chức <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Cá nhân */}
          <label
            onClick={() => setOrganizerType("INDIVIDUAL")}
            className={`flex items-start gap-3.5 rounded-2xl border-2 p-4 cursor-pointer transition ${
              organizerType === "INDIVIDUAL"
                ? "border-blue-600 bg-blue-50/50 shadow-sm"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <input
              type="radio"
              name="organizerType"
              checked={organizerType === "INDIVIDUAL"}
              onChange={() => setOrganizerType("INDIVIDUAL")}
              className="mt-1 h-4 w-4 text-blue-600"
            />
            <div>
              <p className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                <User className="h-4 w-4 text-blue-600" />
                Cá nhân / Nghệ sĩ độc lập
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Dành cho cá nhân tự đứng ra tổ chức workshop, talkshow, giải đấu nhỏ hoặc minishow.
              </p>
            </div>
          </label>

          {/* Doanh nghiệp */}
          <label
            onClick={() => setOrganizerType("BUSINESS")}
            className={`flex items-start gap-3.5 rounded-2xl border-2 p-4 cursor-pointer transition ${
              organizerType === "BUSINESS"
                ? "border-blue-600 bg-blue-50/50 shadow-sm"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <input
              type="radio"
              name="organizerType"
              checked={organizerType === "BUSINESS"}
              onChange={() => setOrganizerType("BUSINESS")}
              className="mt-1 h-4 w-4 text-blue-600"
            />
            <div>
              <p className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                <Building2 className="h-4 w-4 text-blue-600" />
                Công ty / Doanh nghiệp / Tổ chức
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Dành cho các công ty giải trí, truyền thông, doanh nghiệp có mã số thuế và giấy phép ĐKKD.
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* PHẦN 2: THÔNG TIN CƠ BẢN */}
      <div className="mb-8">
        <label className="text-xs font-semibold uppercase text-gray-600 block mb-3">
          2. Thông tin liên hệ cơ bản
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Tên tổ chức */}
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-xs font-semibold text-gray-700">
              Tên tổ chức / Thương hiệu BTC <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <Building2 className="h-4 w-4" />
              </div>
              <input
                type="text"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                placeholder="VD: Công ty TNHH Giải trí V-Live hoặc CLB Âm nhạc Trẻ"
                required
                className="w-full rounded-xl border border-gray-300 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          {/* Email liên hệ */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-700">
              Email liên hệ chính thức <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <Mail className="h-4 w-4" />
              </div>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="organizer@example.com"
                required
                className="w-full rounded-xl border border-gray-300 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          {/* Số điện thoại */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-700">
              Số điện thoại liên hệ <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <Phone className="h-4 w-4" />
              </div>
              <input
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="0987654321"
                required
                className="w-full rounded-xl border border-gray-300 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          {/* Địa chỉ */}
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-xs font-semibold text-gray-700">
              Địa chỉ văn phòng / trụ sở
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <MapPin className="h-4 w-4" />
              </div>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Số nhà, Tên đường, Phường/Xã, Quận/Huyện, Tỉnh/TP"
                className="w-full rounded-xl border border-gray-300 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          {/* Website / Fanpage */}
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-xs font-semibold text-gray-700">
              Website / Trang Fanpage Facebook chính thức
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <Globe className="h-4 w-4" />
              </div>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://facebook.com/my-event-organizer"
                className="w-full rounded-xl border border-gray-300 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
