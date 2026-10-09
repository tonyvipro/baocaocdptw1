import React, { useState } from 'react';
import { FileText, Save, CheckCircle, AlertTriangle, Building, User, DollarSign, Calendar, Plus, RefreshCw, Eye, Download, X } from 'lucide-react';

export default function ContractsManager() {
  const [activeTab, setActiveTab] = useState('list'); // 'list' or 'create'
  const [viewingContract, setViewingContract] = useState(null);
  
  // List State
  const [contracts, setContracts] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    contract_code: '',
    contract_name: '',
    property_id: '',
    broker_id: '',
    customer_id: '',
    start_date: '',
    end_date: '',
    deposit_amount: '',
    rental_price: '',
    currency: 'VND',
    party_a_info: '',
    party_b_info: '',
    tax_code: '',
    terms: '',
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const token = localStorage.getItem('3tv_token') || '';
      const payload = { ...formData };
      
      // Basic formatting before sending
      if (payload.deposit_amount === '') delete payload.deposit_amount;
      if (payload.rental_price === '') delete payload.rental_price;

      const headers = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      let res = await fetch('/api/contracts', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        res = await fetch('http://localhost:8080/api/contracts', {
          method: 'POST',
          headers,
          body: JSON.stringify(payload)
        });
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Có lỗi xảy ra khi tạo hợp đồng.');
      }

      setSuccess(true);
      // Reset form on success
      setFormData({
        contract_code: '',
        contract_name: '',
        property_id: '',
        broker_id: '',
        customer_id: '',
        start_date: '',
        end_date: '',
        deposit_amount: '',
        rental_price: '',
        currency: 'VND',
        party_a_info: '',
        party_b_info: '',
        tax_code: '',
        terms: '',
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchContracts = async () => {
    setListLoading(true);
    try {
      const token = localStorage.getItem('3tv_token') || '';
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== '') params.append('status', statusFilter);

      const headers = { 'Accept': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      let res = await fetch(`/api/contracts?${params.toString()}`, { headers });
      if (!res.ok) {
        res = await fetch(`http://localhost:8080/api/contracts?${params.toString()}`, { headers });
      }
      const data = await res.json();
      setContracts(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setListLoading(false);
    }
  };

  React.useEffect(() => {
    if (activeTab === 'list') {
      fetchContracts();
    }
  }, [activeTab, searchTerm, statusFilter]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 0: return <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full font-semibold">Nháp/Chờ ký</span>;
      case 1: return <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full font-semibold">Hiệu lực</span>;
      case 2: return <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded-full font-semibold">Hết hạn</span>;
      case 3: return <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-semibold">Đã hủy</span>;
      default: return null;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-full flex flex-col">
      <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-lg">Quản Lý Hợp Đồng</h3>
            <p className="text-xs text-slate-500">Tra cứu và soạn thảo hợp đồng BĐS</p>
          </div>
        </div>
        <div className="flex bg-slate-200 p-1 rounded-lg">
          <button 
            onClick={() => setActiveTab('list')}
            className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${activeTab === 'list' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
          >
            Danh sách
          </button>
          <button 
            onClick={() => setActiveTab('create')}
            className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${activeTab === 'create' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
          >
            Tạo mới
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-slate-50/50 relative">
        {activeTab === 'list' ? (
          <div className="p-5 h-full flex flex-col">
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <input 
                type="text" 
                placeholder="Tìm mã hoặc tên HĐ..." 
                className="px-3 py-2 text-sm border border-slate-300 rounded-lg w-full sm:w-64 focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <select 
                className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">Tất cả trạng thái</option>
                <option value="0">Nháp/Chờ ký</option>
                <option value="1">Đang hiệu lực</option>
                <option value="2">Hết hạn</option>
                <option value="3">Đã hủy</option>
              </select>
              <button onClick={fetchContracts} className="px-3 py-2 bg-white border border-slate-300 rounded-lg flex items-center justify-center hover:bg-slate-50">
                <RefreshCw className={`w-4 h-4 text-slate-600 ${listLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
            
            <div className="flex-1 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              {listLoading && contracts.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-400">Đang tải...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-bold text-slate-500">
                      <tr>
                        <th className="px-4 py-3">Mã HĐ</th>
                        <th className="px-4 py-3">Tên Hợp Đồng</th>
                        <th className="px-4 py-3">Ngày Ký</th>
                        <th className="px-4 py-3">Giá trị</th>
                        <th className="px-4 py-3">Trạng thái</th>
                        <th className="px-4 py-3 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {contracts.map(c => (
                        <tr key={c.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-bold text-blue-600">{c.contract_code}</td>
                          <td className="px-4 py-3 text-slate-800 font-medium">{c.contract_name}</td>
                          <td className="px-4 py-3">{c.start_date ? new Date(c.start_date).toLocaleDateString('vi-VN') : 'N/A'}</td>
                          <td className="px-4 py-3 font-semibold">{(Number(c.rental_price) || 0).toLocaleString('vi-VN')} {c.currency}</td>
                          <td className="px-4 py-3">{getStatusBadge(c.status)}</td>
                          <td className="px-4 py-3 text-right">
                            <button onClick={() => setViewingContract(c)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                              <Eye className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {contracts.length === 0 && (
                        <tr>
                          <td colSpan="6" className="px-4 py-8 text-center text-slate-400">Không tìm thấy hợp đồng nào.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-5 sm:p-6">
            <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-8">
          
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-red-800">Lỗi xác thực dữ liệu</h4>
                <p className="text-xs text-red-600 mt-1">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-emerald-800">Thành công!</h4>
                <p className="text-xs text-emerald-600 mt-1">Hợp đồng đã được lưu vào hệ thống và chờ khách hàng xác nhận.</p>
              </div>
            </div>
          )}

          {/* Block 1: Thông tin cơ bản */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-blue-500 rounded-full"></span>
              Thông Tin Cơ Bản
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">Mã Hợp Đồng *</label>
                <input required type="text" name="contract_code" value={formData.contract_code} onChange={handleChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" placeholder="VD: HDMB-2026-001" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">Tên Hợp Đồng *</label>
                <input required type="text" name="contract_name" value={formData.contract_name} onChange={handleChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" placeholder="VD: Hợp đồng mua bán căn hộ Landmark 81" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">ID Bất Động Sản *</label>
                <div className="relative">
                  <Building className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input required type="number" name="property_id" value={formData.property_id} onChange={handleChange} className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" placeholder="ID BĐS..." />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">ID Môi Giới *</label>
                  <input required type="number" name="broker_id" value={formData.broker_id} onChange={handleChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" placeholder="Broker ID" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">ID Khách Hàng *</label>
                  <input required type="number" name="customer_id" value={formData.customer_id} onChange={handleChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" placeholder="Customer ID" />
                </div>
              </div>
            </div>
          </div>

          {/* Block 2: Thời hạn & Tài chính */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-amber-500 rounded-full"></span>
              Thời Hạn & Tài Chính
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">Ngày Bắt Đầu *</label>
                <div className="relative">
                  <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input required type="date" name="start_date" value={formData.start_date} onChange={handleChange} className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm text-slate-600" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">Ngày Kết Thúc *</label>
                <div className="relative">
                  <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input required type="date" name="end_date" value={formData.end_date} onChange={handleChange} className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm text-slate-600" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">Tiền Cọc (Tùy chọn)</label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="number" name="deposit_amount" value={formData.deposit_amount} onChange={handleChange} className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" placeholder="Số tiền..." />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">Giá Trị / Giá Thuê</label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="number" name="rental_price" value={formData.rental_price} onChange={handleChange} className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" placeholder="Số tiền..." />
                </div>
              </div>
            </div>
          </div>

          {/* Block 3: Thông tin pháp lý */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-emerald-500 rounded-full"></span>
              Pháp Lý & Điều Khoản
            </h4>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">Bên A (Chủ nhà/Bán)</label>
                  <textarea name="party_a_info" value={formData.party_a_info} onChange={handleChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm min-h-[80px]" placeholder="Thông tin chi tiết Bên A..."></textarea>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">Bên B (Khách hàng/Thuê)</label>
                  <textarea name="party_b_info" value={formData.party_b_info} onChange={handleChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm min-h-[80px]" placeholder="Thông tin chi tiết Bên B..."></textarea>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">Mã số thuế / Công chứng</label>
                <input type="text" name="tax_code" value={formData.tax_code} onChange={handleChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" placeholder="Nhập mã số thuế..." />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">Điều Khoản Bổ Sung</label>
                <textarea name="terms" value={formData.terms} onChange={handleChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm min-h-[120px]" placeholder="Các điều khoản ràng buộc khác..."></textarea>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pb-8">
            <button type="button" className="px-5 py-2.5 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-200 transition-colors">
              Hủy
            </button>
            <button type="submit" disabled={loading} className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors disabled:opacity-70 disabled:cursor-not-allowed">
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {loading ? 'Đang lưu...' : 'Lưu Hợp Đồng'}
            </button>
          </div>
        </form>
          </div>
        )}
      </div>

      {/* MODAL CHI TIẾT & XUẤT PDF */}
      {viewingContract && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            
            {/* Header Modal */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 print:hidden">
              <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Chi Tiết Hợp Đồng
              </h3>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Xuất PDF / In
                </button>
                <button onClick={() => setViewingContract(null)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Nội dung hợp đồng cần In (Print Area) */}
            <div className="flex-1 overflow-y-auto p-8 print:p-0 bg-white">
              <div className="max-w-3xl mx-auto printable-contract">
                
                {/* Contract Header */}
                <div className="text-center mb-10 border-b-2 border-slate-800 pb-6">
                  <h1 className="text-2xl font-black text-slate-900 uppercase mb-2">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</h1>
                  <h2 className="text-lg font-bold text-slate-800 mb-6">Độc lập - Tự do - Hạnh phúc</h2>
                  <h3 className="text-xl font-black text-slate-900 uppercase mb-2">{viewingContract.contract_name}</h3>
                  <p className="text-sm font-semibold text-slate-600">Mã hợp đồng: {viewingContract.contract_code}</p>
                </div>

                <div className="space-y-6 text-sm text-slate-800 leading-relaxed">
                  
                  {/* Info Grid */}
                  <div className="grid grid-cols-2 gap-x-8 gap-y-4 bg-slate-50 print:bg-transparent p-4 rounded-lg border border-slate-200">
                    <div><span className="font-bold">Ngày bắt đầu:</span> {viewingContract.start_date ? new Date(viewingContract.start_date).toLocaleDateString('vi-VN') : 'N/A'}</div>
                    <div><span className="font-bold">Ngày kết thúc:</span> {viewingContract.end_date ? new Date(viewingContract.end_date).toLocaleDateString('vi-VN') : 'N/A'}</div>
                    <div><span className="font-bold">Tiền cọc:</span> {(Number(viewingContract.deposit_amount) || 0).toLocaleString('vi-VN')} {viewingContract.currency}</div>
                    <div><span className="font-bold">Giá thuê/bán:</span> {(Number(viewingContract.rental_price) || 0).toLocaleString('vi-VN')} {viewingContract.currency}</div>
                    <div><span className="font-bold">Trạng thái:</span> {['Nháp/Chờ ký', 'Đang hiệu lực', 'Hết hạn', 'Đã hủy'][viewingContract.status]}</div>
                    <div><span className="font-bold">Mã số thuế:</span> {viewingContract.tax_code || 'Không có'}</div>
                  </div>

                  {/* Parties */}
                  <div>
                    <h4 className="font-bold text-base uppercase text-slate-900 mb-2 border-l-4 border-blue-600 pl-3">Đại Diện Bên A (Bán/Cho Thuê)</h4>
                    <div className="whitespace-pre-wrap pl-4 text-slate-700 bg-white p-3 border border-slate-100 rounded">
                      {viewingContract.party_a_info || 'Đang cập nhật...'}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-base uppercase text-slate-900 mb-2 border-l-4 border-emerald-600 pl-3">Đại Diện Bên B (Mua/Thuê)</h4>
                    <div className="whitespace-pre-wrap pl-4 text-slate-700 bg-white p-3 border border-slate-100 rounded">
                      {viewingContract.party_b_info || 'Đang cập nhật...'}
                    </div>
                  </div>

                  {/* Terms */}
                  <div className="mb-8">
                    <h4 className="font-bold text-base uppercase text-slate-900 mb-2 border-l-4 border-amber-500 pl-3">Điều Khoản Hợp Đồng</h4>
                    <div className="whitespace-pre-wrap pl-4 text-slate-700 text-justify">
                      {viewingContract.terms || 'Các điều khoản sẽ được thỏa thuận và bổ sung sau.'}
                    </div>
                  </div>

                  {/* Signatures */}
                  <div className="grid grid-cols-2 gap-8 pt-10 mt-10 border-t border-slate-300 pb-20">
                    <div className="text-center">
                      <h4 className="font-bold text-slate-900 uppercase">Đại Diện Bên A</h4>
                      <p className="text-xs text-slate-500 italic mb-16">(Ký và ghi rõ họ tên)</p>
                    </div>
                    <div className="text-center">
                      <h4 className="font-bold text-slate-900 uppercase">Đại Diện Bên B</h4>
                      <p className="text-xs text-slate-500 italic mb-16">(Ký và ghi rõ họ tên)</p>
                    </div>
                  </div>

                </div>
              </div>
            </div>
            
          </div>
        </div>
      )}

      {/* CSS để tối ưu hóa tính năng Print (Ẩn các phần thừa khi xuất PDF) */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .printable-contract, .printable-contract * { visibility: visible; }
          .printable-contract { position: absolute; left: 0; top: 0; width: 100%; padding: 20px; }
          .print\\:hidden { display: none !important; }
          .print\\:p-0 { padding: 0 !important; }
          .print\\:bg-transparent { background-color: transparent !important; }
        }
      `}</style>
    </div>
  );
}
