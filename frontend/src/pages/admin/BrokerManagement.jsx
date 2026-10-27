import useRecordLink from '../../hooks/useRecordLink';
import { useConfirm } from '../../components/forms/ConfirmProvider';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Users, UserCheck, Briefcase, Plus, Search, Filter, RefreshCw, Eye, Edit3, Trash2,
  X, Check, AlertCircle, ChevronLeft, ChevronRight, Phone, Mail, MapPin, Calendar,
  DollarSign, Award, Clock, CheckCircle2, XCircle, AlertTriangle, Lock, UserPlus,
  Building, ShieldCheck, ChevronDown, FileText, ArrowRight
} from 'lucide-react';
import { broadcastDataChange, subscribeDataChange } from '../../services/tabSync';
import ConflictWarningBanner from '../../components/ConflictWarningBanner';

// Helper format tiền tệ VND
const formatVND = (amount) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
};

// Helper format ngày
const formatDate = (dateStr) => {
  if (!dateStr) return '---';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return dateStr;
  }
};

export default function BrokerManagement() {
  const confirm = useConfirm();
  useRecordLink('brokers', async ({ id, tab, signal }) => {
    if (!id) return;
    try {
      const assignment = tab === 'assignments';
      const response = await fetch('/api/' + (assignment ? 'broker-assignments/' : 'brokers/') + id, { signal, headers: { Accept: 'application/json' } });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Không thể tải dữ liệu.');
      if (signal.aborted) return;
      setActiveTab(assignment ? 'assignments' : 'brokers');
      if (assignment) handleOpenViewAssignment(result.data);
      else { setSelectedBroker(result.data); setShowViewBrokerModal(true); }
    } catch (error) { if (error.name !== 'AbortError') showToast(error.message, 'error'); }
  });
  // ========================================================
  // 1. QUẢN LÝ TAB & GIỮ TRẠNG THÁI KHI F5 (F5 TAB PERSISTENCE)
  // ========================================================
  const getInitialTab = () => {
    try {
      const hash = window.location.hash || '';
      if (hash.includes('tab=assignments')) return 'assignments';
      if (hash.includes('tab=brokers')) return 'brokers';
      return localStorage.getItem('3tv_brokers_active_tab') || 'brokers';
    } catch {
      return 'brokers';
    }
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);

  const handleSwitchTab = (tab) => {
    setActiveTab(tab);
    localStorage.setItem('3tv_brokers_active_tab', tab);
    window.location.hash = `#admin/brokers?tab=${tab}`;
  };

  // Đồng bộ hash URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.split('?')[1] || '');
    params.set('tab', activeTab);
    window.location.hash = '#admin/brokers?' + params;
  }, [activeTab]);

  // ========================================================
  // 2. MULTI-TAB SYNC & CHỐNG XUNG ĐỘT (CONFLIC PREVENTION)
  // ========================================================
  const [conflictEvent, setConflictEvent] = useState(null);
  const [conflictLocked, setConflictLocked] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (message, type = 'success') => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    const unsubscribe = subscribeDataChange((event) => {
      if (event.entity === 'brokers' || event.entity === 'broker_assignments') {
        setConflictEvent(event);
        setConflictLocked(true);
      }
    });
    return unsubscribe;
  }, []);

  const handleResolveConflict = () => {
    window.location.reload();
  };

  // ========================================================
  // 3. TAB 1: QUẢN LÝ MÔI GIỚI (DANH SÁCH MÔI GIỚI - HÌNH 29)
  // ========================================================
  const savedBrokerFilter = (() => {
    try {
      return JSON.parse(localStorage.getItem('3tv_broker_filter') || 'null');
    } catch {
      return null;
    }
  })();

  const [brokers, setBrokers] = useState([]);
  const [brokerLoading, setBrokerLoading] = useState(true);
  const [brokerSearch, setBrokerSearch] = useState(() => (savedBrokerFilter?.search || '').slice(0, 250));
  const [brokerLevelFilter, setBrokerLevelFilter] = useState(() => savedBrokerFilter?.level || 'all');
  const [brokerStatusFilter, setBrokerStatusFilter] = useState(() => savedBrokerFilter?.status || 'all');
  const [brokerPage, setBrokerPage] = useState(() => savedBrokerFilter?.page || 1);
  const [brokerPagination, setBrokerPagination] = useState({
    total: 0,
    per_page: 8,
    current_page: 1,
    last_page: 1,
    from: 0,
    to: 0
  });
  const [brokerSummary, setBrokerSummary] = useState({
    total: 0,
    active: 0,
    busy: 0,
    inactive: 0,
    total_deals: 0,
    total_commission: 0
  });

  // Lưu filter tab môi giới vào localStorage khi đổi
  useEffect(() => {
    try {
      localStorage.setItem('3tv_broker_filter', JSON.stringify({
        search: brokerSearch.slice(0, 250),
        level: brokerLevelFilter,
        status: brokerStatusFilter,
        page: brokerPage
      }));
    } catch {}
  }, [brokerSearch, brokerLevelFilter, brokerStatusFilter, brokerPage]);

  // Fetch Danh sách Môi giới
  const fetchBrokers = useCallback(async (page = brokerPage) => {
    setBrokerLoading(true);
    try {
      const token = localStorage.getItem('3tv_token') || '';
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: '8',
      });
      if (brokerSearch.trim()) params.append('search', brokerSearch.trim().slice(0, 250));
      if (brokerLevelFilter !== 'all') params.append('level', brokerLevelFilter);
      if (brokerStatusFilter !== 'all') params.append('status', brokerStatusFilter);

      const res = await fetch(`/api/brokers?${params.toString()}`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      const resData = await res.json();
      if (res.ok && resData.status === 'success') {
        setBrokers(resData.data || []);
        if (resData.pagination) setBrokerPagination(resData.pagination);
        if (resData.summary) setBrokerSummary(resData.summary);
      } else {
        showToast(resData.message || 'Không thể tải danh sách môi giới', 'error');
      }
    } catch (err) {
      showToast('Lỗi kết nối khi tải danh sách môi giới: ' + err.message, 'error');
    } finally {
      setBrokerLoading(false);
    }
  }, [brokerPage, brokerSearch, brokerLevelFilter, brokerStatusFilter]);

  useEffect(() => {
    fetchBrokers(brokerPage);
  }, [fetchBrokers, brokerPage]);

  // Modals Tab 1
  const [showAddBrokerModal, setShowAddBrokerModal] = useState(false);
  const [showEditBrokerModal, setShowEditBrokerModal] = useState(false);
  const [showViewBrokerModal, setShowViewBrokerModal] = useState(false);
  const [showDeleteBrokerModal, setShowDeleteBrokerModal] = useState(false);
  const [selectedBroker, setSelectedBroker] = useState(null);
  const [brokerFormActionLoading, setBrokerFormActionLoading] = useState(false);

  // Form State Môi giới (Maxlength 250)
  const initialBrokerFormData = {
    name: '',
    code: '',
    phone: '',
    email: '',
    level: 'Chuyên viên',
    deals_count: 0,
    total_commission: 0,
    status: 'active',
    notes: '',
  };
  const [brokerFormData, setBrokerFormData] = useState(initialBrokerFormData);
  const [brokerFormErrors, setBrokerFormErrors] = useState({});

  const handleOpenAddBroker = () => {
    setBrokerFormData(initialBrokerFormData);
    setBrokerFormErrors({});
    setShowAddBrokerModal(true);
  };

  const handleOpenEditBroker = (broker) => {
    setSelectedBroker(broker);
    setBrokerFormData({
      name: broker.name || '',
      code: broker.code || '',
      phone: broker.phone || '',
      email: broker.email || '',
      level: broker.level || 'Chuyên viên',
      deals_count: broker.deals_count || 0,
      total_commission: broker.total_commission || 0,
      status: broker.status || 'active',
      notes: broker.notes || '',
    });
    setBrokerFormErrors({});
    setShowEditBrokerModal(true);
  };

  const handleOpenViewBroker = async (broker) => {
    setSelectedBroker(broker);
    setShowViewBrokerModal(true);
    // Fetch chi tiết đầy đủ có kèm assignments
    try {
      const res = await fetch(`/api/brokers/${broker.id}`);
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setSelectedBroker(data.data);
      }
    } catch {}
  };

  const handleOpenDeleteBroker = (broker) => {
    setSelectedBroker(broker);
    setShowAddBrokerModal(false); setShowEditBrokerModal(false); setShowViewBrokerModal(false);
    setShowDeleteBrokerModal(true);
  };

  const handleSaveBroker = async (isEdit = false) => {
    const errors = {};
    if (!brokerFormData.name.trim()) errors.name = 'Vui lòng nhập tên môi giới.';
    if (brokerFormData.name.length > 250) errors.name = 'Tên không được vượt quá 250 ký tự.';
    if (brokerFormData.email && brokerFormData.email.length > 250) errors.email = 'Email không được vượt quá 250 ký tự.';
    if (brokerFormData.notes && brokerFormData.notes.length > 250) errors.notes = 'Ghi chú không được vượt quá 250 ký tự.';

    if (Object.keys(errors).length > 0) {
      setBrokerFormErrors(errors);
      return;
    }

    if (isEdit && !(await confirm({ title: 'Xác nhận cập nhật', message: "Lưu thay đổi thông tin môi giới này?" }))) return;
    setBrokerFormActionLoading(true);
    try {
      const token = localStorage.getItem('3tv_token') || '';
      const url = isEdit ? `/api/brokers/${selectedBroker.id}` : '/api/brokers';
      const method = isEdit ? 'PUT' : 'POST';

      const payload = {
        ...brokerFormData,
        name: brokerFormData.name.slice(0, 250),
        notes: (brokerFormData.notes || '').slice(0, 250),
        ...(isEdit ? { version: selectedBroker.version, last_updated_at: selectedBroker.updated_at } : {})
      };

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      const resData = await res.json();
      if (res.ok && resData.status === 'success') {
        showToast(resData.message, 'success');
        setShowAddBrokerModal(false);
        setShowEditBrokerModal(false);
        fetchBrokers();
        // Thông báo đồng bộ đa tab
        broadcastDataChange({
          entity: 'brokers',
          action: isEdit ? 'update' : 'create',
          id: resData.data?.id,
          message: resData.message
        });
      } else if (res.status === 409) {
        showToast(resData.message, 'error');
        setConflictLocked(true);
        setConflictEvent({ action: 'update', timestamp: Date.now() });
      } else {
        if (resData.errors) {
          setBrokerFormErrors(resData.errors);
        } else {
          showToast(resData.message || 'Có lỗi xảy ra', 'error');
        }
      }
    } catch (err) {
      showToast('Lỗi: ' + err.message, 'error');
    } finally {
      setBrokerFormActionLoading(false);
    }
  };

  const handleDeleteBroker = async () => {
    if (!selectedBroker) return;
    setBrokerFormActionLoading(true);
    try {
      const token = localStorage.getItem('3tv_token') || '';
      const res = await fetch(`/api/brokers/${selectedBroker.id}`, {
        method: 'DELETE',
        body: JSON.stringify({ version: selectedBroker.version }),
        headers: {
          'Accept': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      const resData = await res.json();
      if (res.ok && resData.status === 'success') {
        showToast(resData.message, 'success');
        setShowDeleteBrokerModal(false);
        fetchBrokers();
        broadcastDataChange({
          entity: 'brokers',
          action: 'delete',
          id: selectedBroker.id,
          message: resData.message
        });
      } else {
        showToast(resData.message || 'Không thể xóa môi giới này', 'error');
      }
    } catch (err) {
      showToast('Lỗi xóa môi giới: ' + err.message, 'error');
    } finally {
      setBrokerFormActionLoading(false);
    }
  };


  // ========================================================
  // 4. TAB 2: PHÂN CÔNG MÔI GIỚI (HÌNH 30)
  // ========================================================
  const savedAssignmentFilter = (() => {
    try {
      return JSON.parse(localStorage.getItem('3tv_assignment_filter') || 'null');
    } catch {
      return null;
    }
  })();

  const [assignments, setAssignments] = useState([]);
  const [assignmentLoading, setAssignmentLoading] = useState(true);
  const [assignmentSearch, setAssignmentSearch] = useState(() => (savedAssignmentFilter?.search || '').slice(0, 250));
  const [assignmentStatusFilter, setAssignmentStatusFilter] = useState(() => savedAssignmentFilter?.status || 'all');
  const [assignmentBrokerFilter, setAssignmentBrokerFilter] = useState(() => savedAssignmentFilter?.broker_id || 'all');
  const [assignmentPage, setAssignmentPage] = useState(() => savedAssignmentFilter?.page || 1);
  const [assignmentPagination, setAssignmentPagination] = useState({
    total: 0,
    per_page: 8,
    current_page: 1,
    last_page: 1,
    from: 0,
    to: 0
  });
  const [assignmentSummary, setAssignmentSummary] = useState({
    total: 0,
    pending: 0,
    processing: 0,
    completed: 0,
    cancelled: 0
  });

  // Lưu filter tab phân công vào localStorage khi đổi
  useEffect(() => {
    try {
      localStorage.setItem('3tv_assignment_filter', JSON.stringify({
        search: assignmentSearch.slice(0, 250),
        status: assignmentStatusFilter,
        broker_id: assignmentBrokerFilter,
        page: assignmentPage
      }));
    } catch {}
  }, [assignmentSearch, assignmentStatusFilter, assignmentBrokerFilter, assignmentPage]);

  // Fetch Danh sách Phân công
  const fetchAssignments = useCallback(async (page = assignmentPage) => {
    setAssignmentLoading(true);
    try {
      const token = localStorage.getItem('3tv_token') || '';
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: '8',
      });
      if (assignmentSearch.trim()) params.append('search', assignmentSearch.trim().slice(0, 250));
      if (assignmentStatusFilter !== 'all') params.append('status', assignmentStatusFilter);
      if (assignmentBrokerFilter !== 'all') params.append('broker_id', assignmentBrokerFilter);

      const res = await fetch(`/api/broker-assignments?${params.toString()}`, {
        headers: {
          'Accept': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      const resData = await res.json();
      if (res.ok && resData.status === 'success') {
        setAssignments(resData.data || []);
        if (resData.pagination) setAssignmentPagination(resData.pagination);
        if (resData.summary) setAssignmentSummary(resData.summary);
      } else {
        showToast(resData.message || 'Không thể tải danh sách phân công', 'error');
      }
    } catch (err) {
      showToast('Lỗi kết nối khi tải danh sách phân công: ' + err.message, 'error');
    } finally {
      setAssignmentLoading(false);
    }
  }, [assignmentPage, assignmentSearch, assignmentStatusFilter, assignmentBrokerFilter]);

  useEffect(() => {
    fetchAssignments(assignmentPage);
  }, [fetchAssignments, assignmentPage]);

  // Modals Tab 2
  const [showAddAssignmentModal, setShowAddAssignmentModal] = useState(false);
  const [showEditAssignmentModal, setShowEditAssignmentModal] = useState(false);
  const [showViewAssignmentModal, setShowViewAssignmentModal] = useState(false);
  const [showCancelAssignmentModal, setShowCancelAssignmentModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [assignmentFormActionLoading, setAssignmentFormActionLoading] = useState(false);
  const [cancelNotes, setCancelNotes] = useState('');

  // Form State Phân công (Maxlength 250)
  const initialAssignmentFormData = {
    request_code: '',
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    property_location: '',
    broker_id: '',
    assigned_date: new Date().toISOString().split('T')[0],
    status: 'pending',
    notes: '',
  };
  const [assignmentFormData, setAssignmentFormData] = useState(initialAssignmentFormData);
  const [assignmentFormErrors, setAssignmentFormErrors] = useState({});

  const handleOpenAddAssignment = () => {
    setAssignmentFormData({
      ...initialAssignmentFormData,
      broker_id: brokers.length > 0 ? brokers[0].id : ''
    });
    setAssignmentFormErrors({});
    setShowAddAssignmentModal(true);
  };

  const handleOpenEditAssignment = (assignment) => {
    setSelectedAssignment(assignment);
    setAssignmentFormData({
      request_code: assignment.request_code || '',
      customer_name: assignment.customer_name || '',
      customer_phone: assignment.customer_phone || '',
      customer_email: assignment.customer_email || '',
      property_location: assignment.property_location || '',
      broker_id: assignment.broker_id || '',
      assigned_date: assignment.assigned_date ? assignment.assigned_date.split('T')[0] : '',
      status: assignment.status || 'pending',
      notes: assignment.notes || '',
    });
    setAssignmentFormErrors({});
    setShowEditAssignmentModal(true);
  };

  const handleOpenViewAssignment = (assignment) => {
    setSelectedAssignment(assignment);
    setShowViewAssignmentModal(true);
  };

  const handleOpenCancelAssignment = (assignment) => {
    setSelectedAssignment(assignment);
    setCancelNotes('');
    setShowAddAssignmentModal(false); setShowEditAssignmentModal(false); setShowViewAssignmentModal(false);
    setShowCancelAssignmentModal(true);
  };

  const handleSaveAssignment = async (isEdit = false) => {
    const errors = {};
    if (!assignmentFormData.customer_name.trim()) errors.customer_name = 'Vui lòng nhập tên khách hàng.';
    if (assignmentFormData.customer_name.length > 250) errors.customer_name = 'Tên khách hàng tối đa 250 ký tự.';
    if (!assignmentFormData.property_location.trim()) errors.property_location = 'Vui lòng nhập địa điểm BĐS.';
    if (assignmentFormData.property_location.length > 250) errors.property_location = 'Địa điểm BĐS tối đa 250 ký tự.';
    if (!assignmentFormData.broker_id) errors.broker_id = 'Vui lòng chọn môi giới phụ trách.';
    if (!assignmentFormData.assigned_date) errors.assigned_date = 'Vui lòng chọn ngày yêu cầu.';
    if (assignmentFormData.notes && assignmentFormData.notes.length > 250) errors.notes = 'Ghi chú tối đa 250 ký tự.';

    if (Object.keys(errors).length > 0) {
      setAssignmentFormErrors(errors);
      return;
    }

    if (isEdit && !(await confirm({ title: 'Xác nhận cập nhật', message: "Lưu thay đổi hoặc điều chuyển phân công này?" }))) return;
    setAssignmentFormActionLoading(true);
    try {
      const token = localStorage.getItem('3tv_token') || '';
      const url = isEdit ? `/api/broker-assignments/${selectedAssignment.id}` : '/api/broker-assignments';
      const method = isEdit ? 'PUT' : 'POST';

      const payload = {
        ...assignmentFormData,
        customer_name: assignmentFormData.customer_name.slice(0, 250),
        property_location: assignmentFormData.property_location.slice(0, 250),
        notes: (assignmentFormData.notes || '').slice(0, 250),
        ...(isEdit ? { version: selectedAssignment.version, last_updated_at: selectedAssignment.updated_at } : {})
      };

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      const resData = await res.json();
      if (res.ok && resData.status === 'success') {
        showToast(resData.message, 'success');
        setShowAddAssignmentModal(false);
        setShowEditAssignmentModal(false);
        fetchAssignments();
        broadcastDataChange({
          entity: 'broker_assignments',
          action: isEdit ? 'update' : 'create',
          id: resData.data?.id,
          message: resData.message
        });
      } else if (res.status === 409) {
        showToast(resData.message, 'error');
        setConflictLocked(true);
        setConflictEvent({ action: 'update', timestamp: Date.now() });
      } else {
        if (resData.errors) {
          setAssignmentFormErrors(resData.errors);
        } else {
          showToast(resData.message || 'Có lỗi xảy ra', 'error');
        }
      }
    } catch (err) {
      showToast('Lỗi: ' + err.message, 'error');
    } finally {
      setAssignmentFormActionLoading(false);
    }
  };

  const handleConfirmCancelAssignment = async () => {
    if (!selectedAssignment) return;
    setAssignmentFormActionLoading(true);
    try {
      const token = localStorage.getItem('3tv_token') || '';
      const res = await fetch(`/api/broker-assignments/${selectedAssignment.id}/cancel`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          version: selectedAssignment.version,
          notes: cancelNotes.slice(0, 250)
        })
      });

      const resData = await res.json();
      if (res.ok && resData.status === 'success') {
        showToast(resData.message, 'success');
        setShowCancelAssignmentModal(false);
        fetchAssignments();
        broadcastDataChange({
          entity: 'broker_assignments',
          action: 'update',
          id: selectedAssignment.id,
          message: resData.message
        });
      } else {
        showToast(resData.message || 'Không thể hủy yêu cầu này', 'error');
      }
    } catch (err) {
      showToast('Lỗi: ' + err.message, 'error');
    } finally {
      setAssignmentFormActionLoading(false);
    }
  };

  // Helper render badge trạng thái môi giới
  const renderBrokerStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Hoạt động
          </span>
        );
      case 'busy':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Đang bận
          </span>
        );
      case 'inactive':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            Tạm ngưng
          </span>
        );
    }
  };

  // Helper render badge cấp bậc
  const renderLevelBadge = (level) => {
    switch (level) {
      case 'Giám đốc kinh doanh':
        return <span className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-purple-100 text-purple-700 border border-purple-200">{level}</span>;
      case 'Trưởng nhóm':
        return <span className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-blue-100 text-blue-700 border border-blue-200">{level}</span>;
      case 'Chuyên viên':
        return <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-teal-100 text-teal-700 border border-teal-200">{level}</span>;
      default:
        return <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-100 text-amber-700 border border-amber-200">{level || 'Tập sự'}</span>;
    }
  };

  // Helper render badge trạng thái phân công
  const renderAssignmentStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Chờ xử lý
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin" />
            Đang xử lý
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Hoàn thành
          </span>
        );
      case 'cancelled':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            Đã hủy
          </span>
        );
    }
  };


  return (
    <div className="space-y-6 animate-fade-in">
      {/* Toast Message */}
      {toastMessage && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl backdrop-blur-md text-sm font-bold border transition-all animate-bounce ${
          toastMessage.type === 'error' 
            ? 'bg-rose-900/90 text-rose-100 border-rose-700 shadow-rose-900/50' 
            : 'bg-emerald-900/90 text-emerald-100 border-emerald-700 shadow-emerald-900/50'
        }`}>
          {toastMessage.type === 'error' ? <AlertCircle className="w-5 h-5 text-rose-400" /> : <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
          <span>{toastMessage.message}</span>
        </div>
      )}

      {/* Banner Cảnh báo xung đột đa tab */}
      <ConflictWarningBanner
        conflictEvent={conflictEvent}
        onReload={handleResolveConflict}
        onDismiss={() => { setConflictEvent(null); setConflictLocked(false); }}
        entityName={conflictEvent?.entity === 'brokers' ? 'Danh sách Môi giới' : 'Phân công Môi giới'}
      />

      {/* THANH ĐIỀU HƯỚNG 2 TAB CHÍNH */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-2 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => handleSwitchTab('brokers')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2.5 px-5 py-2.5 rounded-lg text-sm font-extrabold transition-all cursor-pointer ${
              activeTab === 'brokers'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Users className={`w-4 h-4 ${activeTab === 'brokers' ? 'text-blue-600' : 'text-slate-400'}`} />
            <span>Danh sách Môi giới</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-black ${
              activeTab === 'brokers' ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-600'
            }`}>
              {brokerSummary.total}
            </span>
          </button>

          <button
            onClick={() => handleSwitchTab('assignments')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2.5 px-5 py-2.5 rounded-lg text-sm font-extrabold transition-all cursor-pointer ${
              activeTab === 'assignments'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Briefcase className={`w-4 h-4 ${activeTab === 'assignments' ? 'text-indigo-600' : 'text-slate-400'}`} />
            <span>Phân công Môi giới</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-black ${
              activeTab === 'assignments' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-600'
            }`}>
              {assignmentSummary.total}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 pr-2">
          <span className="hidden md:inline">Đồng bộ tự động & giữ trạng thái tab khi tải lại trang</span>
          <button
            onClick={() => {
              if (activeTab === 'brokers') fetchBrokers();
              else fetchAssignments();
              showToast('Đã làm mới dữ liệu!');
            }}
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
            title="Làm mới dữ liệu từ Database"
          >
            <RefreshCw className={`w-4 h-4 ${brokerLoading || assignmentLoading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* ========================================================
          TAB 1: QUẢN LÝ MÔI GIỚI (HÌNH 29)
      ======================================================== */}
      {activeTab === 'brokers' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col animate-fade-in">
          {/* Header & Tiêu đề Tab 1 */}
          <div className="giang-page-heading flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-blue-100 text-blue-700">
                  <UserCheck className="w-5 h-5" />
                </span>
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                  QUẢN LÝ MÔI GIỚI
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Quản lý đội ngũ và thông tin môi giới trên hệ thống
              </p>
            </div>

            {/* Thanh công cụ: Search, Filter, Thêm mới */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Ô tìm kiếm giới hạn 250 ký tự */}
              <div className="relative min-w-[260px] sm:w-72">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  maxLength={250}
                  value={brokerSearch}
                  onChange={(e) => {
                    const val = e.target.value.slice(0, 250);
                    setBrokerSearch(val);
                    setBrokerPage(1);
                  }}
                  placeholder="Tìm kiếm môi giới..."
                  className="w-full pl-10 pr-9 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition shadow-xs"
                />
                {brokerSearch && (
                  <button
                    onClick={() => { setBrokerSearch(''); setBrokerPage(1); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Lọc Cấp bậc */}
              <select
                value={brokerLevelFilter}
                onChange={(e) => { setBrokerLevelFilter(e.target.value); setBrokerPage(1); }}
                className="px-3 py-2 text-xs font-semibold border border-slate-300 rounded-xl bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-xs"
              >
                <option value="all">Tất cả cấp bậc</option>
                <option value="Giám đốc kinh doanh">Giám đốc kinh doanh</option>
                <option value="Trưởng nhóm">Trưởng nhóm</option>
                <option value="Chuyên viên">Chuyên viên</option>
                <option value="Tập sự">Tập sự</option>
              </select>

              {/* Lọc Trạng thái */}
              <select
                value={brokerStatusFilter}
                onChange={(e) => { setBrokerStatusFilter(e.target.value); setBrokerPage(1); }}
                className="px-3 py-2 text-xs font-semibold border border-slate-300 rounded-xl bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-xs"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="active">Hoạt động</option>
                <option value="busy">Đang bận</option>
                <option value="inactive">Tạm ngưng</option>
              </select>

              {/* Nút Thêm Môi giới Mới */}
              <button
                onClick={handleOpenAddBroker}
                disabled={conflictLocked}
                className={`primary-action flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-black shadow-md transition-all cursor-pointer ${
                  conflictLocked
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20 active:scale-95'
                }`}
              >
                {conflictLocked ? <Lock className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                <span>Thêm Môi giới Mới</span>
              </button>
            </div>
          </div>

          {/* Bảng danh sách môi giới */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-black uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-6">Tên Môi giới</th>
                  <th className="py-3.5 px-4">Mã ID</th>
                  <th className="py-3.5 px-4">Cấp bậc</th>
                  <th className="py-3.5 px-4 text-center">Số giao dịch</th>
                  <th className="py-3.5 px-4 text-right">Tổng hoa hồng</th>
                  <th className="py-3.5 px-4 text-center">Trạng thái</th>
                  <th className="py-3.5 px-6 text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {brokerLoading ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-slate-400">
                      <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-600" />
                      <p className="font-semibold">Đang truy vấn dữ liệu môi giới từ cơ sở dữ liệu...</p>
                    </td>
                  </tr>
                ) : brokers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-slate-400">
                      <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p className="font-semibold text-slate-600">Chưa có môi giới phù hợp</p>
                      <p className="text-xs text-slate-400 mt-1">Thêm môi giới mới để bắt đầu, hoặc thay đổi từ khóa và bộ lọc.</p>
                    </td>
                  </tr>
                ) : (
                  brokers.map((broker) => (
                    <tr key={broker.id} className="hover:bg-slate-50/70 transition-colors group">
                      {/* Tên Môi giới */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs uppercase shrink-0">
                            {broker.name ? broker.name.charAt(0) : 'M'}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                              {broker.name}
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-3 mt-0.5">
                              {broker.phone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="w-3 h-3 text-slate-400" />
                                  {broker.phone}
                                </span>
                              )}
                              {broker.email && (
                                <span className="flex items-center gap-1">
                                  <Mail className="w-3 h-3 text-slate-400" />
                                  {broker.email}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Mã ID */}
                      <td className="py-4 px-4 font-mono font-bold text-slate-700">
                        <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 border border-slate-200">
                          {broker.code || `MG-${broker.id}`}
                        </span>
                      </td>

                      {/* Cấp bậc */}
                      <td className="py-4 px-4">
                        {renderLevelBadge(broker.level)}
                      </td>

                      {/* Số giao dịch */}
                      <td className="py-4 px-4 text-center">
                        <span className="font-extrabold text-slate-800 text-sm">
                          {broker.deals_count || 0}
                        </span>
                        <span className="text-[10px] text-slate-400 block">thương vụ</span>
                      </td>

                      {/* Tổng hoa hồng */}
                      <td className="py-4 px-4 text-right">
                        <span className="font-bold text-emerald-600 text-sm">
                          {formatVND(broker.total_commission)}
                        </span>
                      </td>

                      {/* Trạng thái */}
                      <td className="py-4 px-4 text-center">
                        {renderBrokerStatusBadge(broker.status)}
                      </td>

                      {/* Cột Hành động: Xem, Sửa, Xóa */}
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenViewBroker(broker)}
                            title="Xem chi tiết hồ sơ"
                            className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEditBroker(broker)}
                            disabled={conflictLocked}
                            title="Chỉnh sửa thông tin"
                            className={`p-1.5 rounded-lg transition cursor-pointer ${
                              conflictLocked
                                ? 'text-slate-300 cursor-not-allowed'
                                : 'text-slate-600 hover:text-amber-600 hover:bg-amber-50'
                            }`}
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenDeleteBroker(broker)}
                            disabled={conflictLocked}
                            title="Xóa dữ liệu môi giới"
                            className={`p-1.5 rounded-lg transition cursor-pointer ${
                              conflictLocked
                                ? 'text-slate-300 cursor-not-allowed'
                                : 'text-slate-600 hover:text-rose-600 hover:bg-rose-50'
                            }`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Thanh phân trang Tab 1 */}
          <div className="p-4 sm:px-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 bg-slate-50/50">
            <div>
              Hiển thị <span className="font-bold text-slate-800">{brokerPagination.from || 0}</span> đến{' '}
              <span className="font-bold text-slate-800">{brokerPagination.to || 0}</span> trong tổng số{' '}
              <span className="font-bold text-slate-800">{brokerPagination.total || 0}</span> môi giới
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setBrokerPage((p) => Math.max(1, p - 1))}
                disabled={brokerPagination.current_page <= 1 || brokerLoading}
                className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: brokerPagination.last_page || 1 }, (_, i) => i + 1).map((pg) => (
                <button
                  key={pg}
                  onClick={() => setBrokerPage(pg)}
                  className={`w-8 h-8 rounded-lg font-bold text-xs transition ${
                    brokerPagination.current_page === pg
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {pg}
                </button>
              ))}

              <button
                onClick={() => setBrokerPage((p) => Math.min(brokerPagination.last_page, p + 1))}
                disabled={brokerPagination.current_page >= brokerPagination.last_page || brokerLoading}
                className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}


      {/* ========================================================
          TAB 2: PHÂN CÔNG MÔI GIỚI (HÌNH 30)
      ======================================================== */}
      {activeTab === 'assignments' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col animate-fade-in">
          {/* Header & Tiêu đề Tab 2 */}
          <div className="giang-page-heading flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
                  <Briefcase className="w-5 h-5" />
                </span>
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                  PHÂN CÔNG MÔI GIỚI
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Quản lý việc gán môi giới phụ trách cho từng yêu cầu/khách hàng
              </p>
            </div>

            {/* Thanh công cụ: Search, Filter, Tạo phân công mới */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Ô tìm kiếm giới hạn 250 ký tự */}
              <div className="relative min-w-[260px] sm:w-72">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  maxLength={250}
                  value={assignmentSearch}
                  onChange={(e) => {
                    const val = e.target.value.slice(0, 250);
                    setAssignmentSearch(val);
                    setAssignmentPage(1);
                  }}
                  placeholder="Tìm theo ID, khách hàng, địa điểm..."
                  className="w-full pl-10 pr-9 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white transition shadow-xs"
                />
                {assignmentSearch && (
                  <button
                    onClick={() => { setAssignmentSearch(''); setAssignmentPage(1); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Lọc Trạng thái phân công */}
              <select
                value={assignmentStatusFilter}
                onChange={(e) => { setAssignmentStatusFilter(e.target.value); setAssignmentPage(1); }}
                className="px-3 py-2 text-xs font-semibold border border-slate-300 rounded-xl bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-xs"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="pending">Chờ xử lý</option>
                <option value="processing">Đang xử lý</option>
                <option value="completed">Hoàn thành</option>
                <option value="cancelled">Đã hủy</option>
              </select>

              {/* Lọc Môi giới phụ trách */}
              <select
                value={assignmentBrokerFilter}
                onChange={(e) => { setAssignmentBrokerFilter(e.target.value); setAssignmentPage(1); }}
                className="px-3 py-2 text-xs font-semibold border border-slate-300 rounded-xl bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-xs max-w-[180px]"
              >
                <option value="all">Tất cả môi giới</option>
                {brokers.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.code} - {b.name}
                  </option>
                ))}
              </select>

              {/* Nút Tạo phân công mới */}
              <button
                onClick={handleOpenAddAssignment}
                disabled={conflictLocked}
                className={`primary-action flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-black shadow-md transition-all cursor-pointer ${
                  conflictLocked
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20 active:scale-95'
                }`}
              >
                {conflictLocked ? <Lock className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                <span>Tạo phân công mới</span>
              </button>
            </div>
          </div>

          {/* Bảng danh sách phân công */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-black uppercase tracking-wider text-slate-500">
                  <th className="min-w-[150px] whitespace-nowrap py-3.5 px-6">ID Yêu cầu</th>
                  <th className="py-3.5 px-4">Tên khách hàng</th>
                  <th className="py-3.5 px-4">Địa điểm BĐS</th>
                  <th className="py-3.5 px-4">Môi giới được phân công</th>
                  <th className="py-3.5 px-4 text-center">Ngày yêu cầu</th>
                  <th className="py-3.5 px-4 text-center">Trạng thái</th>
                  <th className="py-3.5 px-6 text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {assignmentLoading ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-slate-400">
                      <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-indigo-600" />
                      <p className="font-semibold">Đang truy vấn danh sách phân công từ cơ sở dữ liệu...</p>
                    </td>
                  </tr>
                ) : assignments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-slate-400">
                      <Briefcase className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p className="font-semibold text-slate-600">Chưa có yêu cầu phân công nào</p>
                      <p className="text-xs text-slate-400 mt-1">Bấm nút "Tạo phân công mới" để gán môi giới cho khách hàng</p>
                    </td>
                  </tr>
                ) : (
                  assignments.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors group">
                      {/* ID Yêu cầu */}
                      <td className="whitespace-nowrap py-4 px-6 font-mono font-bold text-slate-700">
                        <span className="inline-flex whitespace-nowrap px-2.5 py-1 rounded-none bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {item.request_code}
                        </span>
                      </td>

                      {/* Tên khách hàng */}
                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-900">{item.customer_name}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-3 mt-0.5">
                          {item.customer_phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" />
                              {item.customer_phone}
                            </span>
                          )}
                          {item.customer_email && (
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3 text-slate-400" />
                              {item.customer_email}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Địa điểm BĐS */}
                      <td className="py-4 px-4 max-w-xs">
                        <div className="flex items-start gap-1.5 text-slate-700 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <span className="line-clamp-2">{item.property_location}</span>
                        </div>
                      </td>

                      {/* Môi giới được phân công */}
                      <td className="py-4 px-4">
                        {item.broker ? (
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-slate-800 text-white flex items-center justify-center font-bold text-xs uppercase shrink-0">
                              {item.broker.name?.charAt(0) || 'M'}
                            </div>
                            <div>
                              <div className="font-bold text-slate-800">{item.broker.name}</div>
                              <div className="text-[10px] text-slate-500">
                                {item.broker.code} • {item.broker.level}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Chưa chỉ định</span>
                        )}
                      </td>

                      {/* Ngày yêu cầu */}
                      <td className="py-4 px-4 text-center text-slate-600 font-medium">
                        <div className="inline-flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {formatDate(item.assigned_date)}
                        </div>
                      </td>

                      {/* Trạng thái */}
                      <td className="py-4 px-4 text-center">
                        {renderAssignmentStatusBadge(item.status)}
                      </td>

                      {/* Cột Hành động: Xem, Sửa, Hủy */}
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenViewAssignment(item)}
                            title="Xem chi tiết phân công"
                            className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEditAssignment(item)}
                            disabled={conflictLocked}
                            title="Chỉnh sửa hoặc đổi môi giới"
                            className={`p-1.5 rounded-lg transition cursor-pointer ${
                              conflictLocked
                                ? 'text-slate-300 cursor-not-allowed'
                                : 'text-slate-600 hover:text-amber-600 hover:bg-amber-50'
                            }`}
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenCancelAssignment(item)}
                            disabled={conflictLocked || item.status === 'cancelled'}
                            title={item.status === 'cancelled' ? 'Yêu cầu đã hủy' : 'Hủy bỏ phân công'}
                            className={`p-1.5 rounded-lg transition cursor-pointer ${
                              conflictLocked || item.status === 'cancelled'
                                ? 'text-slate-300 cursor-not-allowed'
                                : 'text-slate-600 hover:text-rose-600 hover:bg-rose-50'
                            }`}
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Thanh phân trang Tab 2 */}
          <div className="p-4 sm:px-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 bg-slate-50/50">
            <div>
              Hiển thị <span className="font-bold text-slate-800">{assignmentPagination.from || 0}</span> đến{' '}
              <span className="font-bold text-slate-800">{assignmentPagination.to || 0}</span> trong tổng số{' '}
              <span className="font-bold text-slate-800">{assignmentPagination.total || 0}</span> yêu cầu
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setAssignmentPage((p) => Math.max(1, p - 1))}
                disabled={assignmentPagination.current_page <= 1 || assignmentLoading}
                className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: assignmentPagination.last_page || 1 }, (_, i) => i + 1).map((pg) => (
                <button
                  key={pg}
                  onClick={() => setAssignmentPage(pg)}
                  className={`w-8 h-8 rounded-lg font-bold text-xs transition ${
                    assignmentPagination.current_page === pg
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {pg}
                </button>
              ))}

              <button
                onClick={() => setAssignmentPage((p) => Math.min(assignmentPagination.last_page, p + 1))}
                disabled={assignmentPagination.current_page >= assignmentPagination.last_page || assignmentLoading}
                className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}


      {/* ========================================================
          MODALS TAB 1: MÔI GIỚI (THÊM / SỬA / XEM / XÓA)
      ======================================================== */}

      {/* Modal Thêm / Sửa Môi giới */}
      {(showAddBrokerModal || showEditBrokerModal) && (
        <div className="app-dialog-layer fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="form-surface bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[90vh]">
            <div className="giang-dialog-heading flex shrink-0 items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-blue-100 text-blue-700">
                  {showEditBrokerModal ? <Edit3 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </span>
                <h3 className="text-base font-extrabold text-slate-900">
                  {showEditBrokerModal ? 'Chỉnh sửa thông tin môi giới' : 'Thêm môi giới mới vào hệ thống'}
                </h3>
              </div>
              <button
                onClick={() => { setShowAddBrokerModal(false); setShowEditBrokerModal(false); }}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              {/* Tên môi giới - maxlength 250 */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    Tên Môi giới <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {brokerFormData.name.length}/250 ký tự
                  </span>
                </div>
                <input
                  type="text"
                  maxLength={250}
                  value={brokerFormData.name}
                  onChange={(e) => setBrokerFormData({ ...brokerFormData, name: e.target.value.slice(0, 250) })}
                  placeholder="Nhập họ và tên môi giới..."
                  className={`w-full px-3.5 py-2 text-xs border rounded-xl focus:outline-none focus:ring-2 ${
                    brokerFormErrors.name ? 'border-rose-400 focus:ring-rose-500' : 'border-slate-300 focus:ring-blue-500'
                  }`}
                />
                {brokerFormErrors.name && (
                  <p className="text-[11px] text-rose-500 mt-1">{brokerFormErrors.name}</p>
                )}
              </div>

              {/* Mã ID & Cấp bậc */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mã định danh (ID)
                  </label>
                  <input
                    type="text"
                    maxLength={50}
                    value={brokerFormData.code}
                    onChange={(e) => setBrokerFormData({ ...brokerFormData, code: e.target.value.slice(0, 50) })}
                    placeholder="Tự động sinh nếu để trống (MG-xxx)"
                    className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Cấp bậc <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={brokerFormData.level}
                    onChange={(e) => setBrokerFormData({ ...brokerFormData, level: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="Giám đốc kinh doanh">Giám đốc kinh doanh</option>
                    <option value="Trưởng nhóm">Trưởng nhóm</option>
                    <option value="Chuyên viên">Chuyên viên</option>
                    <option value="Tập sự">Tập sự</option>
                  </select>
                </div>
              </div>

              {/* SĐT & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Số điện thoại
                  </label>
                  <input
                    type="text"
                    maxLength={11}
                    value={brokerFormData.phone}
                    onChange={(e) => setBrokerFormData({ ...brokerFormData, phone: e.target.value.replace(/[^0-9]/g, '').slice(0, 11) })}
                    placeholder="VD: 0901234567"
                    className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-slate-700">Email</label>
                    <span className="text-[10px] text-slate-400 font-mono">{brokerFormData.email.length}/250</span>
                  </div>
                  <input
                    type="email"
                    maxLength={250}
                    value={brokerFormData.email}
                    onChange={(e) => setBrokerFormData({ ...brokerFormData, email: e.target.value.slice(0, 250) })}
                    placeholder="email@3tvland.vn"
                    className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Số giao dịch & Tổng hoa hồng & Trạng thái */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Số giao dịch
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={brokerFormData.deals_count}
                    onChange={(e) => setBrokerFormData({ ...brokerFormData, deals_count: parseInt(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tổng hoa hồng (VNĐ)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000000"
                    value={brokerFormData.total_commission}
                    onChange={(e) => setBrokerFormData({ ...brokerFormData, total_commission: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Trạng thái
                  </label>
                  <select
                    value={brokerFormData.status}
                    onChange={(e) => setBrokerFormData({ ...brokerFormData, status: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="active">Hoạt động</option>
                    <option value="busy">Đang bận</option>
                    <option value="inactive">Tạm ngưng</option>
                  </select>
                </div>
              </div>

              {/* Ghi chú / Giới thiệu - Maxlength 250 */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-slate-700">Ghi chú / Khu vực phụ trách</label>
                  <span className="text-[10px] text-slate-400 font-mono">{(brokerFormData.notes || '').length}/250 ký tự</span>
                </div>
                <textarea
                  rows={3}
                  maxLength={250}
                  value={brokerFormData.notes || ''}
                  onChange={(e) => setBrokerFormData({ ...brokerFormData, notes: e.target.value.slice(0, 250) })}
                  placeholder="Ghi chú về chuyên môn, phân khúc, khu vực phụ trách (tối đa 250 ký tự)..."
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 flex items-center justify-end gap-2 bg-slate-50">
              <button
                type="button"
                onClick={() => { setShowAddBrokerModal(false); setShowEditBrokerModal(false); }}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => handleSaveBroker(showEditBrokerModal)}
                disabled={brokerFormActionLoading}
                className="primary-action flex items-center gap-2 px-5 py-2 text-xs font-black text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition disabled:opacity-50"
              >
                {brokerFormActionLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{showEditBrokerModal ? 'Cập nhật thay đổi' : 'Lưu môi giới'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Chi tiết Môi giới (Xem) */}
      {showViewBrokerModal && selectedBroker && (
        <div className="app-dialog-layer fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="form-surface bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col">
            <div className="giang-dialog-heading flex shrink-0 items-center justify-between gap-3">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Eye className="w-5 h-5 text-blue-600" />
                Hồ sơ chi tiết môi giới
              </h3>
              <button onClick={() => setShowViewBrokerModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-2xl shadow-md uppercase">
                  {selectedBroker.name?.charAt(0) || 'M'}
                </div>
                <div>
                  <h4 className="text-lg font-black text-slate-900">{selectedBroker.name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      {selectedBroker.code}
                    </span>
                    {renderLevelBadge(selectedBroker.level)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[11px] text-slate-400 font-bold uppercase block">Số giao dịch</span>
                  <span className="text-lg font-black text-slate-900">{selectedBroker.deals_count || 0}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[11px] text-slate-400 font-bold uppercase block">Tổng hoa hồng</span>
                  <span className="text-sm font-black text-emerald-600">{formatVND(selectedBroker.total_commission)}</span>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Số điện thoại:</span>
                  <span className="font-bold text-slate-800">{selectedBroker.phone || 'Chưa cập nhật'}</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Email:</span>
                  <span className="font-bold text-slate-800">{selectedBroker.email || 'Chưa cập nhật'}</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Trạng thái:</span>
                  <span>{renderBrokerStatusBadge(selectedBroker.status)}</span>
                </div>
                {selectedBroker.notes && (
                  <div className="pt-2">
                    <span className="text-slate-500 block mb-1">Ghi chú chuyên môn:</span>
                    <p className="p-3 rounded-xl bg-slate-50 text-slate-700 italic border border-slate-100">
                      {selectedBroker.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 flex justify-end bg-slate-50">
              <button
                onClick={() => setShowViewBrokerModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Xóa Môi giới */}
      {showDeleteBrokerModal && selectedBroker && (
        <div className="app-dialog-layer fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="form-surface bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Xác nhận xóa môi giới?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Bạn có chắc chắn muốn xóa hồ sơ của môi giới <strong className="text-slate-800">{selectedBroker.name}</strong> ({selectedBroker.code}) khỏi hệ thống? Thao tác này sẽ lưu trực tiếp vào cơ sở dữ liệu.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setShowDeleteBrokerModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleDeleteBroker}
                disabled={brokerFormActionLoading}
                className="flex items-center gap-2 px-5 py-2 text-xs font-black text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md transition disabled:opacity-50"
              >
                {brokerFormActionLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Xác nhận xóa</span>
              </button>
            </div>
          </div>
        </div>
      )}


      {/* ========================================================
          MODALS TAB 2: PHÂN CÔNG (TẠO MỚI / SỬA / XEM / HỦY)
      ======================================================== */}

      {/* Modal Tạo / Sửa Phân công */}
      {(showAddAssignmentModal || showEditAssignmentModal) && (
        <div className="app-dialog-layer fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="form-surface bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[90vh]">
            <div className="giang-dialog-heading flex shrink-0 items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
                  {showEditAssignmentModal ? <Edit3 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </span>
                <h3 className="text-base font-extrabold text-slate-900">
                  {showEditAssignmentModal ? 'Chỉnh sửa / Điều chuyển phân công' : 'Thiết lập phân công môi giới mới'}
                </h3>
              </div>
              <button
                onClick={() => { setShowAddAssignmentModal(false); setShowEditAssignmentModal(false); }}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              {/* ID Yêu cầu (chỉ hiển thị khi sửa) */}
              {showEditAssignmentModal && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mã ID Yêu cầu
                  </label>
                  <input
                    type="text"
                    disabled
                    value={assignmentFormData.request_code}
                    className="w-full px-3.5 py-2 text-xs border border-slate-200 bg-slate-100 rounded-xl text-slate-500 font-mono font-bold"
                  />
                </div>
              )}

              {/* Tên khách hàng - Maxlength 250 */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    Tên khách hàng <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {assignmentFormData.customer_name.length}/250 ký tự
                  </span>
                </div>
                <input
                  type="text"
                  maxLength={250}
                  value={assignmentFormData.customer_name}
                  onChange={(e) => setAssignmentFormData({ ...assignmentFormData, customer_name: e.target.value.slice(0, 250) })}
                  placeholder="Nhập họ và tên khách hàng yêu cầu..."
                  className={`w-full px-3.5 py-2 text-xs border rounded-xl focus:outline-none focus:ring-2 ${
                    assignmentFormErrors.customer_name ? 'border-rose-400 focus:ring-rose-500' : 'border-slate-300 focus:ring-indigo-500'
                  }`}
                />
                {assignmentFormErrors.customer_name && (
                  <p className="text-[11px] text-rose-500 mt-1">{assignmentFormErrors.customer_name}</p>
                )}
              </div>

              {/* SĐT & Email khách hàng */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Số điện thoại KH</label>
                  <input
                    type="text"
                    maxLength={11}
                    value={assignmentFormData.customer_phone}
                    onChange={(e) => setAssignmentFormData({ ...assignmentFormData, customer_phone: e.target.value.replace(/[^0-9]/g, '').slice(0, 11) })}
                    placeholder="VD: 0912345678"
                    className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-slate-700">Email KH</label>
                    <span className="text-[10px] text-slate-400 font-mono">{assignmentFormData.customer_email.length}/250</span>
                  </div>
                  <input
                    type="email"
                    maxLength={250}
                    value={assignmentFormData.customer_email}
                    onChange={(e) => setAssignmentFormData({ ...assignmentFormData, customer_email: e.target.value.slice(0, 250) })}
                    placeholder="khachhang@gmail.com"
                    className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Địa điểm BĐS - Maxlength 250 */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    Địa điểm BĐS <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {assignmentFormData.property_location.length}/250 ký tự
                  </span>
                </div>
                <input
                  type="text"
                  maxLength={250}
                  value={assignmentFormData.property_location}
                  onChange={(e) => setAssignmentFormData({ ...assignmentFormData, property_location: e.target.value.slice(0, 250) })}
                  placeholder="VD: Vinhomes Central Park, Bình Thạnh hoặc Masteri Thảo Điền..."
                  className={`w-full px-3.5 py-2 text-xs border rounded-xl focus:outline-none focus:ring-2 ${
                    assignmentFormErrors.property_location ? 'border-rose-400 focus:ring-rose-500' : 'border-slate-300 focus:ring-indigo-500'
                  }`}
                />
                {assignmentFormErrors.property_location && (
                  <p className="text-[11px] text-rose-500 mt-1">{assignmentFormErrors.property_location}</p>
                )}
              </div>

              {/* Môi giới được phân công & Ngày yêu cầu */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Môi giới được phân công <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={assignmentFormData.broker_id}
                    onChange={(e) => setAssignmentFormData({ ...assignmentFormData, broker_id: e.target.value })}
                    className={`w-full px-3.5 py-2 text-xs border rounded-xl focus:outline-none focus:ring-2 bg-white ${
                      assignmentFormErrors.broker_id ? 'border-rose-400 focus:ring-rose-500' : 'border-slate-300 focus:ring-indigo-500'
                    }`}
                  >
                    <option value="">-- Chọn môi giới phụ trách --</option>
                    {brokers.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.code} - {b.name} ({b.level}) {b.status === 'busy' ? '[Đang bận]' : ''}
                      </option>
                    ))}
                  </select>
                  {assignmentFormErrors.broker_id && (
                    <p className="text-[11px] text-rose-500 mt-1">{assignmentFormErrors.broker_id}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Ngày yêu cầu <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={assignmentFormData.assigned_date}
                    onChange={(e) => setAssignmentFormData({ ...assignmentFormData, assigned_date: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                </div>
              </div>

              {/* Trạng thái phân công */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Trạng thái
                </label>
                <select
                  value={assignmentFormData.status}
                  onChange={(e) => setAssignmentFormData({ ...assignmentFormData, status: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="pending">Chờ xử lý</option>
                  <option value="processing">Đang xử lý</option>
                  <option value="completed">Hoàn thành</option>
                  <option value="cancelled">Đã hủy</option>
                </select>
              </div>

              {/* Ghi chú yêu cầu - Maxlength 250 */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-slate-700">Ghi chú yêu cầu</label>
                  <span className="text-[10px] text-slate-400 font-mono">{(assignmentFormData.notes || '').length}/250 ký tự</span>
                </div>
                <textarea
                  rows={3}
                  maxLength={250}
                  value={assignmentFormData.notes || ''}
                  onChange={(e) => setAssignmentFormData({ ...assignmentFormData, notes: e.target.value.slice(0, 250) })}
                  placeholder="Ghi chú chi tiết về nhu cầu khách hàng, thời gian hẹn xem nhà (tối đa 250 ký tự)..."
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 flex items-center justify-end gap-2 bg-slate-50">
              <button
                type="button"
                onClick={() => { setShowAddAssignmentModal(false); setShowEditAssignmentModal(false); }}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => handleSaveAssignment(showEditAssignmentModal)}
                disabled={assignmentFormActionLoading}
                className="primary-action flex items-center gap-2 px-5 py-2 text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition disabled:opacity-50"
              >
                {assignmentFormActionLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{showEditAssignmentModal ? 'Cập nhật phân công' : 'Lưu phân công'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Chi tiết Phân công (Xem) */}
      {showViewAssignmentModal && selectedAssignment && (
        <div className="app-dialog-layer fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="form-surface bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col">
            <div className="giang-dialog-heading flex shrink-0 items-center justify-between gap-3">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Eye className="w-5 h-5 text-indigo-600" />
                Chi tiết nội dung phân công
              </h3>
              <button onClick={() => setShowViewAssignmentModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 font-bold uppercase">ID Yêu cầu</span>
                  <div className="text-xl font-mono font-black text-indigo-700">{selectedAssignment.request_code}</div>
                </div>
                {renderAssignmentStatusBadge(selectedAssignment.status)}
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                <div className="text-xs font-extrabold text-slate-900 uppercase tracking-wide">
                  Thông tin khách hàng
                </div>
                <div className="text-sm font-bold text-slate-800">{selectedAssignment.customer_name}</div>
                <div className="text-xs text-slate-600 flex items-center gap-4">
                  {selectedAssignment.customer_phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      {selectedAssignment.customer_phone}
                    </span>
                  )}
                  {selectedAssignment.customer_email && (
                    <span className="flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      {selectedAssignment.customer_email}
                    </span>
                  )}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                <div className="text-xs font-extrabold text-slate-900 uppercase tracking-wide">
                  Bất động sản & Phân công
                </div>
                <div className="text-xs text-slate-700 flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span><strong>Địa điểm:</strong> {selectedAssignment.property_location}</span>
                </div>
                <div className="text-xs text-slate-700 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                  <span><strong>Ngày yêu cầu:</strong> {formatDate(selectedAssignment.assigned_date)}</span>
                </div>
                <div className="text-xs text-slate-700 flex items-center gap-2 pt-1 border-t border-slate-200">
                  <UserCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>
                    <strong>Môi giới phụ trách:</strong> {selectedAssignment.broker?.name || '---'} ({selectedAssignment.broker?.code} - {selectedAssignment.broker?.level})
                  </span>
                </div>
              </div>

              {selectedAssignment.notes && (
                <div>
                  <span className="text-xs text-slate-500 font-bold block mb-1">Ghi chú:</span>
                  <p className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/60 text-xs text-amber-900 italic">
                    {selectedAssignment.notes}
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 flex justify-end bg-slate-50">
              <button
                onClick={() => setShowViewAssignmentModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Hủy Phân công */}
      {showCancelAssignmentModal && selectedAssignment && (
        <div className="app-dialog-layer fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="form-surface bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <XCircle className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-extrabold text-slate-900">Hủy yêu cầu phân công?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Bạn có chắc chắn muốn hủy bỏ nhiệm vụ phân công cho yêu cầu <strong className="text-slate-800">{selectedAssignment.request_code}</strong> của khách hàng <strong className="text-slate-800">{selectedAssignment.customer_name}</strong>?
              </p>
            </div>

            <div className="text-left">
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-slate-700">Lý do hủy yêu cầu (tùy chọn)</label>
                <span className="text-[10px] text-slate-400 font-mono">{cancelNotes.length}/250 ký tự</span>
              </div>
              <textarea
                rows={2}
                maxLength={250}
                value={cancelNotes}
                onChange={(e) => setCancelNotes(e.target.value.slice(0, 250))}
                placeholder="Nhập lý do hủy bỏ phân công (tối đa 250 ký tự)..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setShowCancelAssignmentModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Đóng
              </button>
              <button
                onClick={handleConfirmCancelAssignment}
                disabled={assignmentFormActionLoading}
                className="flex items-center gap-2 px-5 py-2 text-xs font-black text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md transition disabled:opacity-50"
              >
                {assignmentFormActionLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Xác nhận Hủy phân công</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
