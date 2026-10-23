import React from 'react';
import { ShieldCheck, MapPin, CheckCircle2 } from 'lucide-react';

// Helper: Chuyển đổi số tiền thành chữ tiếng Việt chuẩn văn bản pháp lý & hợp đồng hành chính
export const convertNumberToVietnameseWords = (num) => {
  if (num === 0 || num === '0') return 'Không đồng';
  if (!num || isNaN(num)) return '';
  num = Math.round(Number(num));
  if (num === 0) return 'Không đồng';
  if (num < 0) return 'Âm ' + convertNumberToVietnameseWords(Math.abs(num));

  const units = ['', 'nghìn', 'triệu', 'tỷ', 'nghìn tỷ', 'triệu tỷ'];
  const digits = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];

  const readGroup = (n, isHighestGroup) => {
    const h = Math.floor(n / 100);
    const t = Math.floor((n % 100) / 10);
    const u = n % 10;
    let str = '';

    if (h > 0) {
      str += digits[h] + ' trăm ';
    } else if (!isHighestGroup) {
      str += 'không trăm ';
    }

    if (t > 1) {
      str += digits[t] + ' mươi ';
      if (u === 1) str += 'mốt ';
      else if (u === 5) str += 'lăm ';
      else if (u > 0) str += digits[u] + ' ';
    } else if (t === 1) {
      str += 'mười ';
      if (u === 5) str += 'lăm ';
      else if (u > 0) str += digits[u] + ' ';
    } else if (t === 0) {
      if (u > 0) {
        if (h > 0 || !isHighestGroup) str += 'lẻ ' + digits[u] + ' ';
        else str += digits[u] + ' ';
      }
    }

    return str.trim();
  };

  const groups = [];
  let temp = num;
  while (temp > 0) {
    groups.push(temp % 1000);
    temp = Math.floor(temp / 1000);
  }

  let result = '';
  for (let i = groups.length - 1; i >= 0; i--) {
    const chunk = groups[i];
    if (chunk > 0) {
      const isHighest = (i === groups.length - 1);
      const chunkStr = readGroup(chunk, isHighest);
      result += chunkStr + (units[i] ? ' ' + units[i] : '') + ' ';
    }
  }

  result = result.trim();
  if (!result) return 'Không đồng';
  return result.charAt(0).toUpperCase() + result.slice(1) + ' đồng chẵn';
};

// Helper: Định dạng ngày tháng
export const formatContractDate = (d) => {
  if (!d) return { day: '.....', month: '.....', year: '2026', full: 'Chưa cập nhật' };
  const date = new Date(d);
  if (isNaN(date.getTime())) return { day: '.....', month: '.....', year: '2026', full: d };
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return { day, month, year, full: `${day}/${month}/${year}` };
};

// Helper: Định dạng tiền tệ
export const formatCurrency = (val) => {
  if (!val) return '0 ₫';
  return Number(val).toLocaleString('vi-VN') + ' ₫';
};

export default function ContractA4Document({
  contract,
  currentUser = null,
  showWatermark = true,
}) {
  if (!contract) return null;

  const approvedExtensions = contract.approved_extensions || contract.extensions || [];
  const startDate = formatContractDate(contract.start_date);
  const endDate = formatContractDate(contract.end_date);
  const createdDate = formatContractDate(contract.created_at || contract.start_date);

  const rentalWords = convertNumberToVietnameseWords(contract.rental_price);
  const depositWords = convertNumberToVietnameseWords(contract.deposit_amount);

  const property = contract.property || {};
  const customer = contract.customer || {};
  const broker = contract.broker || {};

  return (
    <div className="flex justify-center w-full">
      {/* TỜ GIẤY A4 (Standard 210mm x 297mm - 794px Width, Drop Shadow, Legal Serif Font) */}
      <div
        id="contract-a4-document"
        className="w-full max-w-[794px] bg-white text-slate-900 shadow-2xl border border-slate-300 rounded-xs p-8 sm:p-14 md:p-16 relative contract-legal-font text-justify leading-relaxed print:p-0 print:border-none print:shadow-none print:max-w-none print:w-full print:bg-white"
        style={{ minHeight: '1123px' }}
      >
        {/* Dấu mộc số hóa chìm trang trọng (Watermark) */}
        {showWatermark && (
          <div className="absolute right-12 top-28 pointer-events-none select-none opacity-20 rotate-[-12deg] border-4 border-red-600 rounded-2xl p-4 text-center text-red-600 uppercase font-sans font-black leading-tight no-print contract-keep-sans">
            <div className="text-xs tracking-widest">3TV LAND SYSTEM</div>
            <div className="text-sm font-extrabold my-0.5">XÁC THỰC SỐ HÓA</div>
            <div className="text-[10px] tracking-wider">{contract.contract_code}</div>
          </div>
        )}

        {/* 1. QUỐC HIỆU & TIÊU NGỮ (Chuẩn Nghị định 30/2020/NĐ-CP) */}
        <div className="text-center mb-8 pb-4">
          <h1 className="text-base sm:text-lg font-black uppercase tracking-wider text-slate-950">
            CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
          </h1>
          <h2 className="text-sm sm:text-base font-bold italic mt-1 text-slate-800">
            Độc lập - Tự do - Hạnh phúc
          </h2>
          <div className="w-32 h-0.5 bg-slate-900 mx-auto my-3"></div>
          <p className="text-xs italic text-slate-600">
            Thành phố Hồ Chí Minh, ngày {createdDate.day} tháng {createdDate.month} năm {createdDate.year}
          </p>
        </div>

        {/* 2. TÊN HỢP ĐỒNG & SỐ HIỆU */}
        <div className="text-center mb-8">
          <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wide text-slate-950">
            {contract.contract_name || 'HỢP ĐỒNG THUÊ BẤT ĐỘNG SẢN'}
          </h2>
          <p className="text-sm font-bold text-slate-700 mt-1">
            Số hợp đồng: <span className="text-blue-900 font-extrabold">{contract.contract_code}</span>
          </p>
        </div>

        {/* 3. CĂN CỨ PHÁP LÝ */}
        <div className="text-xs italic text-slate-700 mb-6 space-y-1 contract-legal-font">
          <p>- Căn cứ Bộ luật Dân sự số 91/2015/QH13 đã được Quốc hội nước CHXHCN Việt Nam thông qua ngày 24/11/2015;</p>
          <p>- Căn cứ Luật Nhà ở số 27/2023/QH15 và Luật Kinh doanh Bất động sản số 29/2023/QH15;</p>
          <p>- Căn cứ nhu cầu sử dụng thực tế và sự thỏa thuận hoàn toàn tự nguyện giữa các Bên tham gia ký kết.</p>
          <p className="mt-2 font-semibold not-italic">
            Hôm nay, ngày {createdDate.day} tháng {createdDate.month} năm {createdDate.year}, tại Văn phòng Giao dịch 3TV Land, chúng tôi gồm có:
          </p>
        </div>

        {/* 4. KHỐI CÁC BÊN THAM GIA KÝ KẾT */}
        <div className="space-y-5 mb-8 text-xs sm:text-sm">
          {/* BÊN A (BÊN CHO THUÊ) */}
          <div className="p-4 bg-slate-50/80 rounded-lg border border-slate-200 print:bg-transparent print:border-none print:p-0">
            <h3 className="font-bold uppercase text-slate-950 tracking-wide mb-2 flex items-center justify-between">
              <span>BÊN CHO THUÊ (Sau đây gọi tắt là BÊN A):</span>
              <span className="text-[11px] font-normal italic text-slate-500">Đại diện chủ quyền</span>
            </h3>
            <div className="space-y-1 pl-2">
              <p>• <strong>Họ và tên / Đơn vị:</strong> {contract.party_a_info ? contract.party_a_info.split('\n')[0] : 'Đại diện theo pháp luật / Chủ sở hữu Bất động sản'}</p>
              <p>• <strong>Thông tin liên hệ & Pháp lý:</strong></p>
              <div className="pl-4 text-slate-700 whitespace-pre-line text-xs">
                {contract.party_a_info || 'Đại diện Bên A cam kết là chủ sở hữu hoặc người có thẩm quyền cho thuê bất động sản hợp pháp.'}
              </div>
            </div>
          </div>

          {/* BÊN B (BÊN THUÊ) */}
          <div className="p-4 bg-slate-50/80 rounded-lg border border-slate-200 print:bg-transparent print:border-none print:p-0">
            <h3 className="font-bold uppercase text-slate-950 tracking-wide mb-2 flex items-center justify-between">
              <span>BÊN THUÊ (Sau đây gọi tắt là BÊN B):</span>
              <span className="text-[11px] font-normal italic text-slate-500">Khách thuê cư trú</span>
            </h3>
            <div className="space-y-1 pl-2">
              <p>• <strong>Họ và tên người thuê:</strong> {customer.name || contract.customer_name || (currentUser?.name) || 'Khách hàng thuê nhà'}</p>
              <p>• <strong>Số điện thoại:</strong> {customer.phone || contract.customer_phone || (currentUser?.phone) || 'Chưa cập nhật'}</p>
              <p>• <strong>Địa chỉ email:</strong> {customer.email || contract.customer_email || (currentUser?.email) || 'Chưa cập nhật'}</p>
              {contract.party_b_info && (
                <div className="pl-4 mt-1 text-slate-700 whitespace-pre-line text-xs">
                  {contract.party_b_info}
                </div>
              )}
            </div>
          </div>

          {/* BÊN C - ĐƠN VỊ KẾT NỐI & QUẢN LÝ (3TV LAND) */}
          <div className="p-4 bg-slate-50/80 rounded-lg border border-slate-200 print:bg-transparent print:border-none print:p-0">
            <h3 className="font-bold uppercase text-slate-950 tracking-wide mb-2 flex items-center justify-between">
              <span>BÊN MÔI GIỚI & TƯ VẤN TRUNG GIAN (BÊN C):</span>
              <span className="text-[11px] font-normal italic text-slate-500">Sàn giao dịch</span>
            </h3>
            <div className="space-y-1 pl-2">
              <p>• <strong>Đơn vị phụ trách:</strong> Công ty Cổ phần Quản lý & Kinh doanh Bất động sản 3TV LAND</p>
              <p>• <strong>Chuyên viên môi giới hỗ trợ:</strong> {broker.name || contract.broker_name || 'Chuyên viên BĐS 3TV Land'}</p>
              <p>• <strong>Số điện thoại hỗ trợ 24/7:</strong> {broker.phone || contract.broker_phone || '0901234567'}</p>
            </div>
          </div>
        </div>

        {/* Thông báo hình thức ký & gặp mặt công chứng (Nếu là BĐS giá trị cao hoặc trực tiếp) */}
        {(contract.is_high_value || contract.signing_method === 'DIRECT_MEETING') && (
          <div className="mb-6 p-4 bg-amber-50/80 border border-amber-200 rounded-lg text-xs text-amber-950">
            <p className="font-bold uppercase tracking-wider text-amber-900 mb-1 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-amber-600" /> Hợp đồng ký kết trực tiếp có công chứng:
            </p>
            <p>• <strong>Địa điểm gặp mặt ký kết:</strong> {contract.meeting_location || 'Văn phòng công chứng'}</p>
            {contract.meeting_time && (
              <p>• <strong>Thời gian gặp mặt:</strong> {new Date(contract.meeting_time).toLocaleString('vi-VN')}</p>
            )}
            {contract.notary_office && (
              <p>• <strong>Tổ chức hành nghề công chứng:</strong> {contract.notary_office}</p>
            )}
          </div>
        )}

        <p className="text-xs sm:text-sm font-semibold mb-6">
          Hai Bên đã thống nhất cùng nhau ký kết Hợp đồng thuê bất động sản với các điều khoản và điều kiện cụ thể sau đây:
        </p>

        {/* 5. CÁC ĐIỀU KHOẢN HỢP ĐỒNG (TỪ ĐIỀU 1 ĐẾN ĐIỀU 6) */}
        <div className="space-y-6 text-xs sm:text-sm">
          {/* ĐIỀU 1 */}
          <div>
            <h4 className="font-bold uppercase text-slate-950 tracking-wide mb-1.5">
              ĐIỀU 1: ĐỐI TƯỢNG HỢP ĐỒNG (BẤT ĐỘNG SẢN THUÊ)
            </h4>
            <div className="space-y-1 text-justify pl-2">
              <p>
                1.1. Bên A đồng ý cho Bên B thuê và Bên B đồng ý thuê bất động sản thuộc quyền sử dụng hợp pháp của Bên A với thông tin như sau:
              </p>
              <div className="pl-4 my-2 text-xs sm:text-sm space-y-1 text-slate-900">
                <p>• <strong>Tên bất động sản:</strong> {property.title || contract.property_title || 'Căn hộ chung cư cao cấp'}</p>
                <p>• <strong>Mã định danh căn hộ:</strong> <span className="font-bold">{property.code || contract.property_code || 'A101'}</span></p>
                <p>• <strong>Địa chỉ tài sản:</strong> {property.address || contract.property_address || 'Địa chỉ ghi nhận theo hồ sơ'}</p>
                <p>• <strong>Diện tích sử dụng:</strong> {property.area ? `${property.area} m²` : 'Theo hiện trạng thực tế'}</p>
                <p>• <strong>Loại hình tài sản:</strong> {property.type || contract.property_type || 'Căn hộ chung cư'}</p>
              </div>
              <p>
                1.2. <strong>Mục đích sử dụng:</strong> Bên B chỉ được phép sử dụng bất động sản nêu trên vào mục đích để ở và sinh hoạt hợp pháp của bản thân và gia đình. Tuyệt đối không được sử dụng vào mục đích kinh doanh trái phép, tàng trữ vũ khí, chất cháy nổ hoặc các hoạt động vi phạm pháp luật Việt Nam.
              </p>
            </div>
          </div>

          {/* ĐIỀU 2 */}
          <div>
            <h4 className="font-bold uppercase text-slate-950 tracking-wide mb-1.5 contract-legal-font">
              ĐIỀU 2: THỜI HẠN THUÊ VÀ ĐIỀU KIỆN GIA HẠN
            </h4>
            <div className="space-y-1 text-justify pl-2">
              <p>
                2.1. Thời hạn thuê bất động sản là kể từ ngày <strong>{startDate.full}</strong> đến hết ngày <strong>{endDate.full}</strong>.
              </p>
              <p>
                2.2. Thời điểm Bên A bàn giao tài sản và trang thiết bị gắn liền cho Bên B bắt đầu từ ngày <strong>{startDate.full}</strong>, có Biên bản bàn giao hiện trạng đính kèm.
              </p>
              <p>
                2.3. <strong>Điều kiện gia hạn:</strong> Trước khi hết hạn hợp đồng tối thiểu ba mươi (30) ngày, nếu Bên B có nguyện vọng tiếp tục thuê và Bên A đồng ý tiếp tục cho thuê, hai Bên sẽ tiến hành lập và ký kết Phụ lục gia hạn hợp đồng mới.
              </p>
              {approvedExtensions.length > 0 && (
                <div className="p-3 bg-purple-50/70 border border-purple-200 rounded text-xs text-purple-900 my-2">
                  <p className="font-bold">✓ Ghi nhận phụ lục gia hạn đã được phê duyệt hợp lệ:</p>
                  {approvedExtensions.map((ext, idx) => (
                    <p key={idx} className="mt-0.5">
                      - Gia hạn thêm đến ngày: <strong>{ext.new_end_date}</strong> (Giá thuê điều chỉnh: <strong>{formatCurrency(ext.new_rental_price)}/tháng</strong>)
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ĐIỀU 3 */}
          <div>
            <h4 className="font-bold uppercase text-slate-950 tracking-wide mb-1.5">
              ĐIỀU 3: GIÁ THUÊ, TIỀN ĐẶT CỌC VÀ PHƯƠNG THỨC THANH TOÁN
            </h4>
            <div className="space-y-1 text-justify pl-2">
              <p>
                3.1. <strong>Giá thuê nhà:</strong> Là <strong>{formatCurrency(contract.rental_price)}</strong> / tháng.
              </p>
              <p className="italic text-xs text-slate-700">
                (Bằng chữ: <strong>{rentalWords || 'Theo thỏa thuận'}</strong>). Giá thuê này không bao gồm chi phí điện, nước, internet, truyền hình cáp, phí gửi xe và phí dịch vụ quản lý tòa nhà.
              </p>
              <p className="mt-2">
                3.2. <strong>Tiền đặt cọc bảo đảm:</strong> Bên B đặt cọc cho Bên A số tiền là <strong>{formatCurrency(contract.deposit_amount)}</strong>.
              </p>
              <p className="italic text-xs text-slate-700">
                (Bằng chữ: <strong>{depositWords || 'Theo thỏa thuận'}</strong>). Khoản tiền đặt cọc này được giữ để bảo đảm việc thực hiện đầy đủ các nghĩa vụ trong hợp đồng của Bên B và sẽ được Bên A hoàn trả đầy đủ cho Bên B khi kết thúc hợp đồng sau khi đã cấn trừ các khoản công nợ hoặc tổn thất (nếu có).
              </p>
              <p className="mt-2">
                3.3. <strong>Kỳ hạn thanh toán:</strong> Định kỳ thanh toán là <strong>{contract.billing_cycle || 1} tháng/lần</strong>. Bên B có nghĩa vụ thanh toán đầy đủ tiền thuê nhà cho Bên A trước hoặc đúng vào ngày quy định của mỗi kỳ.
              </p>
              <p>
                3.4. <strong>Hình thức thanh toán:</strong> Chuyển khoản qua tài khoản ngân hàng hoặc tiền mặt. Mỗi khoản thanh toán sẽ được hệ thống 3TV Land ghi nhận và phát hành Hóa đơn điện tử có mã đối soát.
              </p>
            </div>
          </div>

          {/* ĐIỀU 4 */}
          <div>
            <h4 className="font-bold uppercase text-slate-950 tracking-wide mb-1.5">
              ĐIỀU 4: QUYỀN VÀ NGHĨA VỤ CỦA BÊN CHO THUÊ (BÊN A)
            </h4>
            <div className="space-y-1 text-justify pl-2">
              <p>4.1. Bàn giao bất động sản và các trang thiết bị nội thất theo đúng Biên bản bàn giao cho Bên B vào ngày bắt đầu thuê.</p>
              <p>4.2. Bảo đảm cho Bên B quyền sử dụng trọn vẹn, ổn định và độc lập đối với bất động sản thuê trong suốt thời hạn hợp đồng.</p>
              <p>4.3. Thu tiền thuê nhà và tiền đặt cọc đúng kỳ hạn theo quy định tại Điều 3 của Hợp đồng này.</p>
              <p>4.4. Kịp thời phối hợp sửa chữa các hư hại lớn thuộc về kết cấu công trình không do lỗi của Bên B gây ra.</p>
            </div>
          </div>

          {/* ĐIỀU 5 */}
          <div>
            <h4 className="font-bold uppercase text-slate-950 tracking-wide mb-1.5">
              ĐIỀU 5: QUYỀN VÀ NGHĨA VỤ CỦA BÊN THUÊ (BÊN B)
            </h4>
            <div className="space-y-1 text-justify pl-2">
              <p>5.1. Nhận bàn giao bất động sản và sử dụng đúng mục đích quy định tại Điều 1 của Hợp đồng này.</p>
              <p>5.2. Thanh toán đầy đủ, đúng hạn tiền thuê nhà và các chi phí tiện ích phát sinh (điện, nước, dịch vụ tòa nhà, wifi...).</p>
              <p>5.3. Có trách nhiệm giữ gìn, bảo quản tài sản, thiết bị trong nhà; chấp hành nghiêm ngặt nội quy ban quản trị tòa nhà và pháp luật cư trú hiện hành.</p>
              <p>5.4. Không được tự ý đập phá, thay đổi kết cấu xây dựng, hoặc cho bên thứ ba thuê lại nếu chưa có văn bản đồng ý của Bên A.</p>
              <p>5.5. Bàn giao lại tài sản cho Bên A khi hợp đồng kết thúc theo hiện trạng ban đầu (trừ hao mòn tự nhiên).</p>
            </div>
          </div>

          {/* ĐIỀU 6 */}
          <div>
            <h4 className="font-bold uppercase text-slate-950 tracking-wide mb-1.5">
              ĐIỀU 6: ĐIỀU KHOẢN CHUNG VÀ CAM KẾT THI HÀNH
            </h4>
            <div className="space-y-1 text-justify pl-2">
              <p>
                6.1. <strong>Các thỏa thuận bổ sung:</strong> {contract.terms || 'Hai bên cam kết thực hiện đúng và đầy đủ mọi điều khoản đã thỏa thuận trong hợp đồng này. Mọi sửa đổi, bổ sung chỉ có giá trị khi được lập thành văn bản và có chữ ký của hai Bên.'}
              </p>
              <p>
                6.2. <strong>Giải quyết tranh chấp:</strong> Trong quá trình thực hiện hợp đồng, nếu phát sinh tranh chấp, hai Bên sẽ cùng nhau bàn bạc giải quyết trên tinh thần thương lượng hòa giải. Trường hợp không thể tự thương lượng được thì sẽ yêu cầu Tòa án nhân dân có thẩm quyền giải quyết.
              </p>
              <p>
                6.3. <strong>Hiệu lực:</strong> Hợp đồng này có hiệu lực kể từ ngày ký. Hợp đồng được lập thành 02 (hai) bản có giá trị pháp lý như nhau, mỗi bên giữ 01 (một) bản để thực hiện. Bản số hóa lưu trữ trên hệ thống 3TV Land có giá trị tra cứu và đối soát điện tử.
              </p>
            </div>
          </div>
        </div>

        {/* 6. KHỐI CHỮ KÝ VÀ CON DẤU XÁC NHẬN */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 pt-10 mt-12 border-t-2 border-slate-900 pb-12">
          {/* Bên A */}
          <div className="text-center">
            <h5 className="font-bold text-slate-950 uppercase text-xs sm:text-sm">ĐẠI DIỆN BÊN A</h5>
            <p className="text-[11px] text-slate-500 italic mb-16">(Ký, điểm chỉ & ghi rõ họ tên)</p>
            <div className="font-bold text-slate-800 text-xs sm:text-sm">
              {contract.party_a_info ? contract.party_a_info.split('\n')[0] : 'Đại Diện Bên A'}
            </div>
          </div>

          {/* Bên B */}
          <div className="text-center">
            <h5 className="font-bold text-slate-950 uppercase text-xs sm:text-sm">ĐẠI DIỆN BÊN B</h5>
            <p className="text-[11px] text-slate-500 italic mb-16">(Ký, điểm chỉ & ghi rõ họ tên)</p>
            <div className="font-bold text-slate-800 text-xs sm:text-sm">
              {customer.name || contract.customer_name || (currentUser?.name) || 'Khách Hàng Ký'}
            </div>
          </div>

          {/* Bên C (3TV Land) */}
          <div className="text-center col-span-2 sm:col-span-1">
            <h5 className="font-bold text-slate-950 uppercase text-xs sm:text-sm">XÁC THỰC HỆ THỐNG</h5>
            <p className="text-[11px] text-slate-500 italic mb-4">(Đơn vị môi giới 3TV Land)</p>
            
            {/* Con dấu điện tử đỏ mô phỏng */}
            <div className="inline-block border-2 border-dashed border-red-500 bg-red-50/50 p-2 rounded-xl text-center text-red-600 mb-2 contract-keep-sans">
              <div className="flex items-center justify-center gap-1 text-[11px] font-bold">
                <ShieldCheck className="w-3.5 h-3.5 text-red-600" />
                <span>ĐÃ DUYỆT ĐIỆN TỬ</span>
              </div>
              <div className="text-[9px] text-slate-500">Mã: {contract.contract_code}</div>
            </div>

            <div className="font-bold text-slate-800 text-xs sm:text-sm">
              {broker.name || contract.broker_name || '3TV LAND CORP'}
            </div>
          </div>
        </div>

        {/* 7. Footer chân trang A4 */}
        <div className="pt-4 border-t border-slate-200 text-center text-[11px] text-slate-500 flex items-center justify-between">
          <span>Hệ thống Quản lý Bất động sản 3TV Land</span>
          <span>Trang 1 / 1 (Khổ A4)</span>
          <span>Mã HĐ: {contract.contract_code}</span>
        </div>
      </div>
    </div>
  );
}
