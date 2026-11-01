import { useState, useEffect, useCallback } from "react";
import {
  getOrganizerRequestStats,
  getOrganizerRequests,
  getOrganizerRequestById,
  approveOrganizerRequest,
  rejectOrganizerRequest,
} from "../services/organizerRequestService";
import OrganizerRequestStats from "../components/organizerRequests/OrganizerRequestStats";
import OrganizerRequestToolbar from "../components/organizerRequests/OrganizerRequestToolbar";
import OrganizerRequestTable from "../components/organizerRequests/OrganizerRequestTable";
import OrganizerRequestDetailModal from "../components/organizerRequests/OrganizerRequestDetailModal";
import OrganizerRequestApproveModal from "../components/organizerRequests/OrganizerRequestApproveModal";
import OrganizerRequestRejectModal from "../components/organizerRequests/OrganizerRequestRejectModal";
import Pagination from "../../../components/common/Pagination";
import { Alert } from "../../../components/common/Arlet";
import ImagePreviewModal from "../../../components/common/ImagePreviewModal";
import { Building2, CheckCircle2, AlertCircle, X } from "lucide-react";

export default function OrganizerRequestsPage() {
  // Data states
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    cancelled: 0,
  });

  // Filter & Pagination states
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(10);
  const [statusFilter, setStatusFilter] = useState("");
  const [keyword, setKeyword] = useState("");
  const [searchInput, setSearchInput] = useState("");

  // Loading & Alert states
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  // Modal states
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Approve modal states
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [targetApproveReq, setTargetApproveReq] = useState(null);
  const [approving, setApproving] = useState(false);

  // Reject modal states
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [targetRejectReq, setTargetRejectReq] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectError, setRejectError] = useState("");
  const [rejecting, setRejecting] = useState(false);

  // Zoom image modal state
  const [zoomedImage, setZoomedImage] = useState(null);

  const showAlert = (variant, title, message) => {
    setAlert({
      variant,
      title,
      message,
      icon: variant === "success" ? CheckCircle2 : AlertCircle,
    });
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const res = await getOrganizerRequestStats();
      if (res?.data) {
        setStats(res.data);
      }
    } catch (err) {
      console.error("Fetch stats error:", err);
    } finally {
      setStatsLoading(false);
    }
  };

  // Fetch requests list
  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getOrganizerRequests({
        page,
        limit,
        status: statusFilter,
        keyword,
      });

      if (res?.data) {
        const list = res.data.requests || res.data.items || [];
        setRequests(list);
        if (res.data.pagination) {
          setTotalPages(res.data.pagination.totalPages || 1);
        }
      }
    } catch (err) {
      console.error("Fetch requests error:", err);
      showAlert("error", "Lỗi tải dữ liệu", err.message || "Không thể tải danh sách đơn đăng ký");
    } finally {
      setLoading(false);
    }
  }, [page, limit, statusFilter, keyword]);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // Handle Search submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setKeyword(searchInput.trim());
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearchInput("");
    setKeyword("");
    setStatusFilter("");
    setPage(1);
  };

  // Open detail modal
  const handleViewDetail = async (reqId) => {
    setShowDetailModal(true);
    setDetailLoading(true);
    try {
      const res = await getOrganizerRequestById(reqId);
      setSelectedRequest(res.data);
    } catch (err) {
      showAlert("error", "Lỗi", err.message || "Không thể tải chi tiết đơn đăng ký");
      setShowDetailModal(false);
    } finally {
      setDetailLoading(false);
    }
  };

  // Open Approve confirm
  const handleOpenApprove = (req) => {
    setTargetApproveReq(req);
    setShowApproveModal(true);
  };

  // Submit Approve
  const handleConfirmApprove = async () => {
    if (!targetApproveReq) return;
    setApproving(true);
    try {
      await approveOrganizerRequest(targetApproveReq.id);
      showAlert(
        "success",
        "Thành công",
        `Đã phê duyệt đơn đăng ký của "${targetApproveReq.organizationName}". Tài khoản đã được nâng cấp lên Ban Tổ Chức!`
      );
      setShowApproveModal(false);
      setShowDetailModal(false);
      setTargetApproveReq(null);
      fetchStats();
      fetchRequests();
    } catch (err) {
      showAlert("error", "Phê duyệt thất bại", err.message || "Đã xảy ra lỗi khi duyệt đơn");
    } finally {
      setApproving(false);
    }
  };

  // Open Reject modal
  const handleOpenReject = (req) => {
    setTargetRejectReq(req);
    setRejectReason("");
    setRejectError("");
    setShowRejectModal(true);
  };

  // Submit Reject
  const handleConfirmReject = async (e) => {
    e.preventDefault();
    if (!rejectReason.trim()) {
      setRejectError("Vui lòng nhập lý do từ chối đơn đăng ký");
      return;
    }
    if (rejectReason.trim().length < 5) {
      setRejectError("Lý do từ chối phải có tối thiểu 5 ký tự");
      return;
    }

    setRejecting(true);
    setRejectError("");
    try {
      await rejectOrganizerRequest(targetRejectReq.id, rejectReason.trim());
      showAlert(
        "success",
        "Đã từ chối đơn",
        `Đã từ chối đơn đăng ký của "${targetRejectReq.organizationName}". Hệ thống đã gửi email giải thích lý do tới người nộp.`
      );
      setShowRejectModal(false);
      setShowDetailModal(false);
      setTargetRejectReq(null);
      fetchStats();
      fetchRequests();
    } catch (err) {
      setRejectError(err.message || "Đã xảy ra lỗi khi từ chối đơn");
    } finally {
      setRejecting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER TRANG */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
          <Building2 className="h-7 w-7 text-blue-600" />
          Xét duyệt đơn đăng ký Ban Tổ Chức
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Kiểm tra thông tin pháp lý, hồ sơ định danh và phê duyệt tài khoản người dùng thành Ban Tổ Chức sự kiện
        </p>
      </div>

      {/* THÔNG BÁO ALERT */}
      {alert && (
        <Alert
          variant={alert.variant}
          title={alert.title}
          icon={alert.icon}
          onClose={() => setAlert(null)}
        >
          {alert.message}
        </Alert>
      )}

      {/* 1. THẺ THỐNG KÊ */}
      <OrganizerRequestStats stats={stats} loading={statsLoading} />

      {/* 2. THANH TÌM KIẾM & BỘ LỌC */}
      <OrganizerRequestToolbar
        searchInput={searchInput}
        onSearchInputChange={setSearchInput}
        statusFilter={statusFilter}
        onStatusFilterChange={(val) => {
          setStatusFilter(val);
          setPage(1);
        }}
        onSearchSubmit={handleSearchSubmit}
        onResetFilters={handleResetFilters}
      />

      {/* 3. BẢNG DANH SÁCH & PHÂN TRANG */}
      <div className="rounded-2xl border border-gray-200/80 bg-white shadow-sm overflow-hidden">
        <OrganizerRequestTable
          requests={requests}
          loading={loading}
          onViewDetail={handleViewDetail}
          onOpenApprove={handleOpenApprove}
          onOpenReject={handleOpenReject}
        />

        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={(newPage) => setPage(newPage)}
        />
      </div>

      {/* 4. MODAL CHI TIẾT */}
      <OrganizerRequestDetailModal
        show={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        request={selectedRequest}
        loading={detailLoading}
        onOpenApprove={handleOpenApprove}
        onOpenReject={handleOpenReject}
        onZoomImage={setZoomedImage}
      />

      {/* 5. MODAL XÁC NHẬN PHÊ DUYỆT */}
      <OrganizerRequestApproveModal
        show={showApproveModal}
        onClose={() => setShowApproveModal(false)}
        targetRequest={targetApproveReq}
        onConfirmApprove={handleConfirmApprove}
        approving={approving}
      />

      {/* 6. MODAL TỪ CHỐI */}
      <OrganizerRequestRejectModal
        show={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        targetRequest={targetRejectReq}
        rejectReason={rejectReason}
        onRejectReasonChange={setRejectReason}
        rejectError={rejectError}
        onConfirmReject={handleConfirmReject}
        rejecting={rejecting}
      />

      {/* 7. MODAL PHÓNG TO ẢNH TÀI LIỆU (DÙNG CHUNG) */}
      <ImagePreviewModal
        src={zoomedImage}
        title="Tài liệu đính kèm"
        onClose={() => setZoomedImage(null)}
      />
    </div>
  );
}
