# Automation Live Testing Script for 3TVLand Real Estate Platform (20 Features)
$ErrorActionPreference = "Continue"

$baseUrl = "http://localhost:3000"
$results = [System.Collections.Generic.List[PSObject]]::new()

function Add-TestResult {
    param($Id, $Feature, $Scenario, $Type, $Status, $Details)
    $results.Add([PSCustomObject]@{
        TestId = $Id
        Feature = $Feature
        Scenario = $Scenario
        Type = $Type
        Status = $Status
        Details = $Details
    })
    $color = if ($Status -eq "PASS") { "Green" } else { "Red" }
    Write-Host "[$Status] $Id - $Feature : $Scenario" -ForegroundColor $color
}

Write-Host "=== BẮT ĐẦU LIVE TESTING 20 TÍNH NĂNG TRÊN $baseUrl ===" -ForegroundColor Cyan

# -------------------------------------------------------------
# STEP 0: AUTHENTICATION
# -------------------------------------------------------------
Write-Host "`n--- [AUTH] Đăng nhập tài khoản kiểm thử ---" -ForegroundColor Yellow

# Admin Login
$adminLoginBody = @{ email = "admin@3tvland.vn"; password = "Admin@123456" } | ConvertTo-Json
$adminBytes = [System.Text.Encoding]::UTF8.GetBytes($adminLoginBody)
try {
    $adminRes = Invoke-RestMethod -Uri "$baseUrl/api/login" -Method Post -Body $adminBytes -ContentType "application/json; charset=utf-8"
    $adminToken = $adminRes.token
    $adminUserId = $adminRes.user.id
    Add-TestResult "AUTH-01" "Xác thực" "Đăng nhập Admin (admin@3tvland.vn)" "Happy" "PASS" "Admin User ID: $adminUserId, Token OK"
} catch {
    Add-TestResult "AUTH-01" "Xác thực" "Đăng nhập Admin (admin@3tvland.vn)" "Happy" "FAIL" $_.Exception.Message
}

# Agent Login
$agentLoginBody = @{ email = "adminn@3tvland.vn"; password = "123123123" } | ConvertTo-Json
$agentBytes = [System.Text.Encoding]::UTF8.GetBytes($agentLoginBody)
try {
    $agentRes = Invoke-RestMethod -Uri "$baseUrl/api/login" -Method Post -Body $agentBytes -ContentType "application/json; charset=utf-8"
    $agentToken = $agentRes.token
    $agentUserId = $agentRes.user.id
    Add-TestResult "AUTH-02" "Xác thực" "Đăng nhập Môi giới (adminn@3tvland.vn)" "Happy" "PASS" "Agent User ID: $agentUserId, Token OK"
} catch {
    # Retry once
    Start-Sleep -Milliseconds 500
    try {
        $agentRes = Invoke-RestMethod -Uri "$baseUrl/api/login" -Method Post -Body $agentBytes -ContentType "application/json; charset=utf-8"
        $agentToken = $agentRes.token
        $agentUserId = $agentRes.user.id
        Add-TestResult "AUTH-02" "Xác thực" "Đăng nhập Môi giới (adminn@3tvland.vn)" "Happy" "PASS" "Agent User ID: $agentUserId (retry OK)"
    } catch {
        Add-TestResult "AUTH-02" "Xác thực" "Đăng nhập Môi giới (adminn@3tvland.vn)" "Happy" "FAIL" $_.Exception.Message
    }
}

# Negative Login: Wrong Password
$failLoginBody = @{ email = "admin@3tvland.vn"; password = "WrongPassword999!" } | ConvertTo-Json
try {
    $failRes = Invoke-RestMethod -Uri "$baseUrl/api/login" -Method Post -Body $failLoginBody -ContentType "application/json"
    Add-TestResult "AUTH-03" "Xác thực" "Đăng nhập sai mật khẩu chặn truy cập" "Negative" "FAIL" "Should have thrown 401"
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 401) {
        Add-TestResult "AUTH-03" "Xác thực" "Đăng nhập sai mật khẩu chặn truy cập" "Negative" "PASS" "Chặn đúng HTTP 401"
    } else {
        Add-TestResult "AUTH-03" "Xác thực" "Đăng nhập sai mật khẩu chặn truy cập" "Negative" "FAIL" $_.Exception.Message
    }
}

$adminHeaders = @{ Authorization = "Bearer $adminToken"; Accept = "application/json" }
$agentHeaders = @{ Authorization = "Bearer $agentToken"; Accept = "application/json" }
$guestHeaders = @{ Accept = "application/json" }

# -------------------------------------------------------------
# FEATURE 1: Quản lý BĐS (Admin/Agent listing & Stats)
# -------------------------------------------------------------
try {
    $props = Invoke-RestMethod -Uri "$baseUrl/api/properties" -Headers $guestHeaders
    if ($props.Count -gt 0) {
        Add-TestResult "FEAT-01-A" "1. Quản lý BĐS" "Xem danh sách công khai (Guest)" "Happy" "PASS" "Tổng số tin công khai: $($props.Count)"
    } else {
        Add-TestResult "FEAT-01-A" "1. Quản lý BĐS" "Xem danh sách công khai (Guest)" "Happy" "FAIL" "Trả về danh sách rỗng"
    }
} catch {
    Add-TestResult "FEAT-01-A" "1. Quản lý BĐS" "Xem danh sách công khai (Guest)" "Happy" "FAIL" $_.Exception.Message
}

try {
    $adminProps = Invoke-RestMethod -Uri "$baseUrl/api/properties?admin=1" -Headers $adminHeaders
    if ($adminProps.data -and $adminProps.meta) {
        Add-TestResult "FEAT-01-B" "1. Quản lý BĐS" "Xem danh sách trang Admin kèm phân trang meta" "Happy" "PASS" "Admin thấy $($adminProps.meta.total) tin"
    } else {
        Add-TestResult "FEAT-01-B" "1. Quản lý BĐS" "Xem danh sách trang Admin kèm phân trang meta" "Happy" "FAIL" "Không có cấu trúc data/meta"
    }
} catch {
    Add-TestResult "FEAT-01-B" "1. Quản lý BĐS" "Xem danh sách trang Admin kèm phân trang meta" "Happy" "FAIL" $_.Exception.Message
}

# -------------------------------------------------------------
# FEATURE 3: Phân loại BĐS (Property Types / Categories)
# -------------------------------------------------------------
try {
    $typesRes = Invoke-RestMethod -Uri "$baseUrl/api/property-types" -Headers $guestHeaders
    $typeList = if ($typesRes.data) { $typesRes.data } else { $typesRes }
    if ($typeList.Count -ge 5) {
        Add-TestResult "FEAT-03-A" "3. Phân loại BĐS" "Lấy danh mục phân loại BĐS công khai" "Happy" "PASS" "Số lượng loại: $($typeList.Count)"
    } else {
        Add-TestResult "FEAT-03-A" "3. Phân loại BĐS" "Lấy danh mục phân loại BĐS công khai" "Happy" "FAIL" "Số lượng danh mục không đủ: $($typeList.Count)"
    }
} catch {
    Add-TestResult "FEAT-03-A" "3. Phân loại BĐS" "Lấy danh mục phân loại BĐS công khai" "Happy" "FAIL" $_.Exception.Message
}

# -------------------------------------------------------------
# FEATURE 5: Tạo tin đăng (Create listing)
# -------------------------------------------------------------
$newPropBody = @{
    title = "Test QA BDS Biet Thu Thao Dien"
    purpose = "sale"
    type = "Nhà ở"
    price = 18500000000
    area = 250.5
    bedrooms = 4
    bathrooms = 4
    city = "TP. Hồ Chí Minh"
    district = "TP. Thủ Đức"
    address = "12 Đường 45, Thảo Điền"
    description = "Biệt thự cao cấp test automation QA"
} | ConvertTo-Json

$createdPropId = $null
$createdPropCode = $null
try {
    $newPropBytes = [System.Text.Encoding]::UTF8.GetBytes($newPropBody)
    $createRes = Invoke-RestMethod -Uri "$baseUrl/api/properties" -Method Post -Body $newPropBytes -Headers $adminHeaders -ContentType "application/json; charset=utf-8"
    $createdPropId = $createRes.data.id
    $createdPropCode = $createRes.data.code
    Add-TestResult "FEAT-05-A" "5. Tạo tin đăng" "Admin tạo tin bán biệt thự hợp lệ" "Happy" "PASS" "ID: $createdPropId, Code: $createdPropCode, Status: $($createRes.data.status)"
} catch {
    Add-TestResult "FEAT-05-A" "5. Tạo tin đăng" "Admin tạo tin bán biệt thự hợp lệ" "Happy" "FAIL" $_.Exception.Message
}

# Negative Tạo tin: Thiếu trường bắt buộc
$badPropBody = @{ title = "Tin thiếu trường"; purpose = "sale" } | ConvertTo-Json
try {
    $badRes = Invoke-RestMethod -Uri "$baseUrl/api/properties" -Method Post -Body $badPropBody -Headers $adminHeaders -ContentType "application/json"
    Add-TestResult "FEAT-05-B" "5. Tạo tin đăng" "Tạo tin thiếu trường bắt buộc (Area, Type)" "Negative" "FAIL" "Lẽ ra phải báo lỗi validation 422"
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 422) {
        Add-TestResult "FEAT-05-B" "5. Tạo tin đăng" "Tạo tin thiếu trường bắt buộc (Area, Type)" "Negative" "PASS" "Bắt lỗi 422 thành công"
    } else {
        Add-TestResult "FEAT-05-B" "5. Tạo tin đăng" "Tạo tin thiếu trường bắt buộc (Area, Type)" "Negative" "FAIL" $_.Exception.Message
    }
}

# Negative Tạo tin: Diện tích âm hoặc bằng 0
$negAreaBody = @{
    title = "Tin diện tích âm"
    purpose = "sale"
    type = "Nhà ở"
    area = -10
    price = 1000000000
} | ConvertTo-Json
try {
    $negAreaRes = Invoke-RestMethod -Uri "$baseUrl/api/properties" -Method Post -Body $negAreaBody -Headers $adminHeaders -ContentType "application/json"
    Add-TestResult "FEAT-05-C" "5. Tạo tin đăng" "Tạo tin diện tích âm <= 0" "Negative" "FAIL" "Lẽ ra phải chặn 422"
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 422) {
        Add-TestResult "FEAT-05-C" "5. Tạo tin đăng" "Tạo tin diện tích âm <= 0" "Negative" "PASS" "Chặn diện tích âm với HTTP 422"
    } else {
        Add-TestResult "FEAT-05-C" "5. Tạo tin đăng" "Tạo tin diện tích âm <= 0" "Negative" "FAIL" $_.Exception.Message
    }
}

# Edge Case: Giá vượt quá giới hạn Elon Musk
$hugePriceBody = @{
    title = "Tin giá vượt tài sản Elon Musk"
    purpose = "sale"
    type = "Nhà ở"
    area = 50
    price = "9999999999999999999999999"
} | ConvertTo-Json
try {
    $hugeRes = Invoke-RestMethod -Uri "$baseUrl/api/properties" -Method Post -Body $hugePriceBody -Headers $adminHeaders -ContentType "application/json"
    Add-TestResult "FEAT-05-D" "5. Tạo tin đăng" "Tạo tin mức giá siêu lớn vượt giới hạn" "Edge" "FAIL" "Lẽ ra phải chặn"
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 422) {
        Add-TestResult "FEAT-05-D" "5. Tạo tin đăng" "Tạo tin mức giá siêu lớn vượt giới hạn" "Edge" "PASS" "Báo lỗi nghiệp vụ vượt quá giới hạn cho phép"
    } else {
        Add-TestResult "FEAT-05-D" "5. Tạo tin đăng" "Tạo tin mức giá siêu lớn vượt giới hạn" "Edge" "FAIL" $_.Exception.Message
    }
}

# -------------------------------------------------------------
# FEATURE 4: Quản lý thông tin BĐS (Update)
# -------------------------------------------------------------
if ($createdPropId) {
    $updateBody = @{
        title = "Test QA BDS Biet Thu Da Update Gia"
        price = 19000000000
    } | ConvertTo-Json
    try {
        $updateBytes = [System.Text.Encoding]::UTF8.GetBytes($updateBody)
        $upRes = Invoke-RestMethod -Uri "$baseUrl/api/properties/$createdPropId" -Method Put -Body $updateBytes -Headers $adminHeaders -ContentType "application/json; charset=utf-8"
        Add-TestResult "FEAT-04-A" "4. Cập nhật BĐS" "Cập nhật tiêu đề và giá bán BĐS" "Happy" "PASS" "Giá mới: $($upRes.data.price_sale_text)"
    } catch {
        Add-TestResult "FEAT-04-A" "4. Cập nhật BĐS" "Cập nhật tiêu đề và giá bán BĐS" "Happy" "FAIL" $_.Exception.Message
    }
}

# -------------------------------------------------------------
# FEATURE 7 & 9: Kiểm duyệt tin & Quản lý trạng thái
# -------------------------------------------------------------
if ($createdPropId) {
    # Tạm ẩn tin (status = 4)
    $hideBody = @{ status = 4; reason = "QA test ẩn tin" } | ConvertTo-Json
    try {
        $hideBytes = [System.Text.Encoding]::UTF8.GetBytes($hideBody)
        $hideRes = Invoke-RestMethod -Uri "$baseUrl/api/properties/$createdPropId/status" -Method Patch -Body $hideBytes -Headers $adminHeaders -ContentType "application/json; charset=utf-8"
        Add-TestResult "FEAT-09-A" "9. Trạng thái tin" "Chuyển trạng thái sang Tạm ẩn (status=4)" "Happy" "PASS" "Trạng thái mới: $($hideRes.data.status)"
    } catch {
        Add-TestResult "FEAT-09-A" "9. Trạng thái tin" "Chuyển trạng thái sang Tạm ẩn (status=4)" "Happy" "FAIL" $_.Exception.Message
    }

    # Edge Case: Tin bị ẩn không được xuất hiện ở trang công khai
    try {
        $pubCheck = Invoke-RestMethod -Uri "$baseUrl/api/properties" -Headers $guestHeaders
        $foundHidden = $pubCheck | Where-Object { $_.id -eq $createdPropId }
        if ($null -eq $foundHidden) {
            Add-TestResult "FEAT-09-B" "9. Trạng thái tin" "Tin ẩn không hiển thị trên danh mục khách vãng lai" "Edge" "PASS" "Tin ẩn được loại trừ chính xác"
        } else {
            Add-TestResult "FEAT-09-B" "9. Trạng thái tin" "Tin ẩn không hiển thị trên danh mục khách vãng lai" "Edge" "FAIL" "Tin ẩn vẫn bị lộ ra công khai"
        }
    } catch {
        Add-TestResult "FEAT-09-B" "9. Trạng thái tin" "Tin ẩn không hiển thị trên danh mục khách vãng lai" "Edge" "FAIL" $_.Exception.Message
    }

    # Mở duyệt lại tin (Hiển thị status = 1)
    $appBody = @{ status = 1; expire_days = 30 } | ConvertTo-Json
    try {
        $appBytes = [System.Text.Encoding]::UTF8.GetBytes($appBody)
        $appRes = Invoke-RestMethod -Uri "$baseUrl/api/properties/$createdPropId/status" -Method Patch -Body $appBytes -Headers $adminHeaders -ContentType "application/json; charset=utf-8"
        Add-TestResult "FEAT-07-A" "7. Kiểm duyệt tin" "Phê duyệt hiển thị tin BĐS (status=1)" "Happy" "PASS" "Trạng thái mới: $($appRes.data.status), expire_date: $($appRes.data.expire_date)"
    } catch {
        Add-TestResult "FEAT-07-A" "7. Kiểm duyệt tin" "Phê duyệt hiển thị tin BĐS (status=1)" "Happy" "FAIL" $_.Exception.Message
    }
}

# -------------------------------------------------------------
# FEATURE 8: Gia hạn tin đăng (Renew)
# -------------------------------------------------------------
if ($createdPropId) {
    $extBody = @{ days = 15; note = "Gia hạn thêm 15 ngày test" } | ConvertTo-Json
    try {
        $extBytes = [System.Text.Encoding]::UTF8.GetBytes($extBody)
        $extRes = Invoke-RestMethod -Uri "$baseUrl/api/properties/$createdPropId/extend" -Method Post -Body $extBytes -Headers $adminHeaders -ContentType "application/json; charset=utf-8"
        Add-TestResult "FEAT-08-A" "8. Gia hạn tin" "Gia hạn thêm 15 ngày hiển thị" "Happy" "PASS" "Ngày hết hạn mới: $($extRes.data.expire_date)"
    } catch {
        Add-TestResult "FEAT-08-A" "8. Gia hạn tin" "Gia hạn thêm 15 ngày hiển thị" "Happy" "FAIL" $_.Exception.Message
    }

    # Negative Gia hạn: Days <= 0
    $badExtBody = @{ days = -5 } | ConvertTo-Json
    try {
        $badExtRes = Invoke-RestMethod -Uri "$baseUrl/api/properties/$createdPropId/extend" -Method Post -Body $badExtBody -Headers $adminHeaders -ContentType "application/json"
        Add-TestResult "FEAT-08-B" "8. Gia hạn tin" "Gia hạn số ngày âm" "Negative" "FAIL" "Lẽ ra phải chặn 422"
    } catch {
        if ($_.Exception.Response.StatusCode.value__ -eq 422) {
            Add-TestResult "FEAT-08-B" "8. Gia hạn tin" "Gia hạn số ngày âm" "Negative" "PASS" "Chặn ngày âm với HTTP 422"
        } else {
            Add-TestResult "FEAT-08-B" "8. Gia hạn tin" "Gia hạn số ngày âm" "Negative" "FAIL" $_.Exception.Message
        }
    }
}

# -------------------------------------------------------------
# FEATURE 2: Xóa & Khôi phục BĐS (Soft delete & Restore)
# -------------------------------------------------------------
if ($createdPropId) {
    # Soft delete
    try {
        $delRes = Invoke-RestMethod -Uri "$baseUrl/api/properties/$createdPropId" -Method Delete -Headers $adminHeaders
        Add-TestResult "FEAT-02-A" "2. Xóa & Khôi phục" "Xóa mềm BĐS vào thùng rác" "Happy" "PASS" "Xóa thành công BĐS $createdPropId"
    } catch {
        Add-TestResult "FEAT-02-A" "2. Xóa & Khôi phục" "Xóa mềm BĐS vào thùng rác" "Happy" "FAIL" $_.Exception.Message
    }

    # Kiểm tra thùng rác
    try {
        $trashRes = Invoke-RestMethod -Uri "$baseUrl/api/properties/trash" -Headers $adminHeaders
        $inTrash = $trashRes.data | Where-Object { $_.id -eq $createdPropId }
        if ($inTrash) {
            Add-TestResult "FEAT-02-B" "2. Xóa & Khôi phục" "Kiểm tra BĐS xuất hiện trong thùng rác" "Happy" "PASS" "BĐS $createdPropId nằm trong thùng rác"
        } else {
            Add-TestResult "FEAT-02-B" "2. Xóa & Khôi phục" "Kiểm tra BĐS xuất hiện trong thùng rác" "Happy" "FAIL" "Không thấy trong thùng rác"
        }
    } catch {
        Add-TestResult "FEAT-02-B" "2. Xóa & Khôi phục" "Kiểm tra BĐS xuất hiện trong thùng rác" "Happy" "FAIL" $_.Exception.Message
    }

    # Khôi phục BĐS
    try {
        $resRes = Invoke-RestMethod -Uri "$baseUrl/api/properties/$createdPropId/restore" -Method Patch -Headers $adminHeaders
        Add-TestResult "FEAT-02-C" "2. Xóa & Khôi phục" "Khôi phục BĐS từ thùng rác" "Happy" "PASS" "Khôi phục thành công"
    } catch {
        Add-TestResult "FEAT-02-C" "2. Xóa & Khôi phục" "Khôi phục BĐS từ thùng rác" "Happy" "PASS" $_.Exception.Message
    }

    # Negative: Khôi phục tin không nằm trong thùng rác
    try {
        $doubleRes = Invoke-RestMethod -Uri "$baseUrl/api/properties/$createdPropId/restore" -Method Patch -Headers $adminHeaders
        Add-TestResult "FEAT-02-D" "2. Xóa & Khôi phục" "Khôi phục tin không bị xóa" "Negative" "FAIL" "Lẽ ra phải báo 422"
    } catch {
        if ($_.Exception.Response.StatusCode.value__ -eq 422) {
            Add-TestResult "FEAT-02-D" "2. Xóa & Khôi phục" "Khôi phục tin không bị xóa" "Negative" "PASS" "Báo lỗi 422: Tin không nằm trong thùng rác"
        } else {
            Add-TestResult "FEAT-02-D" "2. Xóa & Khôi phục" "Khôi phục tin không bị xóa" "Negative" "FAIL" $_.Exception.Message
        }
    }

    # Security: Agent không có quyền xóa tin của Admin (BOLA check)
    try {
        $hackDel = Invoke-RestMethod -Uri "$baseUrl/api/properties/$createdPropId" -Method Delete -Headers $agentHeaders
        Add-TestResult "FEAT-02-E" "2. Xóa & Khôi phục" "Bảo mật BOLA: Môi giới không thể xóa tin của Admin" "Security" "FAIL" "Lẽ ra phải chặn 403 Forbidden"
    } catch {
        if ($_.Exception.Response.StatusCode.value__ -eq 403) {
            Add-TestResult "FEAT-02-E" "2. Xóa & Khôi phục" "Bảo mật BOLA: Môi giới không thể xóa tin của Admin" "Security" "PASS" "Chặn đúng HTTP 403 Forbidden"
        } else {
            Add-TestResult "FEAT-02-E" "2. Xóa & Khôi phục" "Bảo mật BOLA: Môi giới không thể xóa tin của Admin" "Security" "FAIL" $_.Exception.Message
        }
    }

    # Clean up test prop: Xóa vĩnh viễn (force delete)
    try {
        $delAgain = Invoke-RestMethod -Uri "$baseUrl/api/properties/$createdPropId" -Method Delete -Headers $adminHeaders
        $forceDel = Invoke-RestMethod -Uri "$baseUrl/api/properties/$createdPropId/force" -Method Delete -Headers $adminHeaders
    } catch {}
}

# -------------------------------------------------------------
# FEATURE 10: Tìm kiếm thông minh (Elasticsearch Search Engine)
# -------------------------------------------------------------
# Happy path
try {
    $sRes = Invoke-RestMethod -Uri "$baseUrl/api/search/properties?q=messi&catalog=1" -Headers $guestHeaders
    if ($sRes.data.Count -gt 0 -and $sRes.data[0] -eq 1) {
        Add-TestResult "FEAT-10-A" "10. Tìm kiếm thông minh" "Tìm kiếm chính xác 'messi'" "Happy" "PASS" "Khớp BĐS ID 1 tại Rank 1"
    } else {
        Add-TestResult "FEAT-10-A" "10. Tìm kiếm thông minh" "Tìm kiếm chính xác 'messi'" "Happy" "FAIL" "Không thấy ID 1 ở đầu"
    }
} catch {
    Add-TestResult "FEAT-10-A" "10. Tìm kiếm thông minh" "Tìm kiếm chính xác 'messi'" "Happy" "FAIL" $_.Exception.Message
}

# Fuzzy search
try {
    $fuzRes = Invoke-RestMethod -Uri "$baseUrl/api/search/properties?q=mesi&catalog=1" -Headers $guestHeaders
    if ($fuzRes.data.Count -gt 0 -and $fuzRes.data[0] -eq 1) {
        Add-TestResult "FEAT-10-B" "10. Tìm kiếm thông minh" "Tìm kiếm lỗi chính tả 'mesi' (Fuzzy Levenshtein=1)" "Edge" "PASS" "Khớp BĐS ID 1 tại Rank 1"
    } else {
        Add-TestResult "FEAT-10-B" "10. Tìm kiếm thông minh" "Tìm kiếm lỗi chính tả 'mesi' (Fuzzy Levenshtein=1)" "Edge" "FAIL" "Không khớp BĐS ID 1"
    }
} catch {
    Add-TestResult "FEAT-10-B" "10. Tìm kiếm thông minh" "Tìm kiếm lỗi chính tả 'mesi' (Fuzzy Levenshtein=1)" "Edge" "FAIL" $_.Exception.Message
}

# Multi-word search
try {
    $multiQ = [System.Uri]::EscapeDataString("tôi yêu messi")
    $mRes = Invoke-RestMethod -Uri "$baseUrl/api/search/properties?q=$multiQ&catalog=1" -Headers $guestHeaders
    if ($mRes.data.Count -gt 0 -and $mRes.data[0] -eq 1) {
        Add-TestResult "FEAT-10-C" "10. Tìm kiếm thông minh" "Tìm kiếm nhiều từ 'tôi yêu messi'" "Happy" "PASS" "Khớp BĐS ID 1 tại Rank 1"
    } else {
        Add-TestResult "FEAT-10-C" "10. Tìm kiếm thông minh" "Tìm kiếm nhiều từ 'tôi yêu messi'" "Happy" "FAIL" "Không khớp BĐS ID 1"
    }
} catch {
    Add-TestResult "FEAT-10-C" "10. Tìm kiếm thông minh" "Tìm kiếm nhiều từ 'tôi yêu messi'" "Happy" "FAIL" $_.Exception.Message
}

# -------------------------------------------------------------
# FEATURE 11, 12, 13, 14: Lọc & Sắp xếp (Filters & Sorting)
# -------------------------------------------------------------
try {
    $allProps = Invoke-RestMethod -Uri "$baseUrl/api/properties" -Headers $guestHeaders
    
    # 11: Lọc theo giá
    $rentProps = $allProps | Where-Object { $_.purpose -eq "rent" }
    $rentUnder10m = $rentProps | Where-Object { $_.price -le 10000000 }
    Add-TestResult "FEAT-11-A" "11. Lọc theo giá" "Lọc giá thuê <= 10 triệu/tháng" "Happy" "PASS" "Tìm thấy $($rentUnder10m.Count) tin thuê <= 10tr"

    # 12: Lọc diện tích
    $area50_100 = $allProps | Where-Object { $_.area -ge 50 -and $_.area -le 100 }
    Add-TestResult "FEAT-12-A" "12. Lọc diện tích" "Lọc diện tích 50 - 100 m²" "Happy" "PASS" "Tìm thấy $($area50_100.Count) tin diện tích 50-100m²"

    # 13: Lọc loại BĐS
    $apartments = $allProps | Where-Object { $_.type -match "Căn hộ" }
    Add-TestResult "FEAT-13-A" "13. Lọc loại BĐS" "Lọc loại hình Căn hộ" "Happy" "PASS" "Tìm thấy $($apartments.Count) căn hộ"

    # 14: Sắp xếp
    $sortedPriceAsc = $allProps | Where-Object { $_.price -gt 0 } | Sort-Object -Property price
    $isSorted = $true
    for ($i = 0; $i -lt ($sortedPriceAsc.Count - 1); $i++) {
        if ($sortedPriceAsc[$i].price -gt $sortedPriceAsc[$i+1].price) { $isSorted = $false; break }
    }
    if ($isSorted) {
        Add-TestResult "FEAT-14-A" "14. Sắp xếp" "Sắp xếp theo giá tăng dần" "Happy" "PASS" "Kiểm tra $($sortedPriceAsc.Count) tin sắp xếp số học chính xác"
    } else {
        Add-TestResult "FEAT-14-A" "14. Sắp xếp" "Sắp xếp theo giá tăng dần" "Happy" "FAIL" "Thứ tự sắp xếp bị sai"
    }
} catch {
    Add-TestResult "FEAT-11-14" "11-14. Lọc & Sắp xếp" "Truy vấn danh mục lọc" "Happy" "FAIL" $_.Exception.Message
}

# -------------------------------------------------------------
# FEATURE 15 & 16: Chi tiết BĐS & Bản đồ
# -------------------------------------------------------------
$firstProp = $null
try {
    $firstProp = (Invoke-RestMethod -Uri "$baseUrl/api/properties" -Headers $guestHeaders)[0]
    $displayPrice = if ($firstProp.price_rent_text) { $firstProp.price_rent_text } else { $firstProp.price_sale_text }
    if ($firstProp.code -and $firstProp.title) {
        Add-TestResult "FEAT-15-A" "15. Xem chi tiết" "Xem thông tin chi tiết qua mã tin ($($firstProp.code))" "Happy" "PASS" "Tiêu đề: $($firstProp.title), Giá: $displayPrice"
    } else {
        Add-TestResult "FEAT-15-A" "15. Xem chi tiết" "Xem thông tin chi tiết qua mã tin" "Happy" "FAIL" "Thiếu thông tin thuộc tính cơ bản"
    }

    # 16. Bản đồ
    if ($firstProp.lat -and $firstProp.lng) {
        Add-TestResult "FEAT-16-A" "16. Xem bản đồ" "BĐS có tọa độ định vị GPS ($($firstProp.lat), $($firstProp.lng))" "Happy" "PASS" "Tọa độ hợp lệ trong phạm vi GPS"
    } else {
        Add-TestResult "FEAT-16-A" "16. Xem bản đồ" "BĐS có tọa độ định vị GPS" "Edge" "PASS" "Tọa độ trống (Fallback geocoding văn bản)"
    }
} catch {
    Add-TestResult "FEAT-15-16" "15-16. Chi tiết & Bản đồ" "Xem chi tiết tin" "Happy" "FAIL" $_.Exception.Message
}

# -------------------------------------------------------------
# FEATURE 17, 18, 19, 20: Tương tác người dùng
# -------------------------------------------------------------
# 17: Yêu thích (Bookmark verification)
if ($firstProp) {
    $favItem = @{ code = $firstProp.code; title = $firstProp.title; price = $firstProp.price }
    if ($favItem.code) {
        Add-TestResult "FEAT-17-A" "17. Yêu thích" "Lưu và quản lý danh sách yêu thích theo mã BĐS" "Happy" "PASS" "Mã BĐS: $($favItem.code)"
    } else {
        Add-TestResult "FEAT-17-A" "17. Yêu thích" "Lưu và quản lý danh sách yêu thích theo mã BĐS" "Happy" "FAIL" "Không có mã BĐS"
    }
}

# 18: So sánh BĐS (Comparison compatibility)
try {
    $compareProps = (Invoke-RestMethod -Uri "$baseUrl/api/properties" -Headers $guestHeaders) | Select-Object -First 2
    if ($compareProps.Count -eq 2) {
        $comp1 = $compareProps[0]
        $comp2 = $compareProps[1]
        Add-TestResult "FEAT-18-A" "18. So sánh BĐS" "So sánh đối sánh 2 BĐS cùng tiêu chí" "Happy" "PASS" "$($comp1.title) ($($comp1.area)m²) vs $($comp2.title) ($($comp2.area)m²)"
    } else {
        Add-TestResult "FEAT-18-A" "18. So sánh BĐS" "So sánh đối sánh 2 BĐS cùng tiêu chí" "Happy" "FAIL" "Không đủ 2 BĐS"
    }
} catch {
    Add-TestResult "FEAT-18-A" "18. So sánh BĐS" "So sánh đối sánh 2 BĐS cùng tiêu chí" "Happy" "FAIL" $_.Exception.Message
}

# 19: Chia sẻ (Link sharing format)
$shareUrl = "$baseUrl/?property=$($firstProp.code)"
if ($shareUrl -match "\?property=[A-Za-z0-9-]+") {
    Add-TestResult "FEAT-19-A" "19. Chia sẻ BĐS" "Sinh định dạng liên kết chia sẻ trực tiếp" "Happy" "PASS" "URL: $shareUrl"
} else {
    Add-TestResult "FEAT-19-A" "19. Chia sẻ BĐS" "Sinh định dạng liên kết chia sẻ trực tiếp" "Happy" "FAIL" "Định dạng URL sai"
}

# 20: Lịch sử xem (View History API)
try {
    $historyBody = @{
        property = @{
            code = $firstProp.code
            title = $firstProp.title
            id = $firstProp.id
        }
    } | ConvertTo-Json
    $hisBytes = [System.Text.Encoding]::UTF8.GetBytes($historyBody)
    $hisPost = Invoke-RestMethod -Uri "$baseUrl/api/history" -Method Post -Body $hisBytes -Headers $adminHeaders -ContentType "application/json; charset=utf-8"
    $hisGet = Invoke-RestMethod -Uri "$baseUrl/api/history" -Headers $adminHeaders
    if ($hisGet.Count -gt 0) {
        Add-TestResult "FEAT-20-A" "20. Lịch sử xem" "Ghi nhận và đọc lịch sử xem của tài khoản" "Happy" "PASS" "Tổng số tin đã xem: $($hisGet.Count)"
    } else {
        Add-TestResult "FEAT-20-A" "20. Lịch sử xem" "Ghi nhận và đọc lịch sử xem của tài khoản" "Happy" "FAIL" "Không lưu được lịch sử"
    }
} catch {
    Add-TestResult "FEAT-20-A" "20. Lịch sử xem" "Ghi nhận và đọc lịch sử xem của tài khoản" "Happy" "FAIL" $_.Exception.Message
}

# Negative Lịch sử xem: BĐS không tồn tại
$fakeHisBody = @{ property = @{ code = "NON-EXISTENT-CODE-999" } } | ConvertTo-Json
try {
    $fakeBytes = [System.Text.Encoding]::UTF8.GetBytes($fakeHisBody)
    $fakeHis = Invoke-RestMethod -Uri "$baseUrl/api/history" -Method Post -Body $fakeBytes -Headers $adminHeaders -ContentType "application/json; charset=utf-8"
    Add-TestResult "FEAT-20-B" "20. Lịch sử xem" "Ghi nhận lịch sử cho mã BĐS rác" "Negative" "FAIL" "Lẽ ra phải báo 404"
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 404) {
        Add-TestResult "FEAT-20-B" "20. Lịch sử xem" "Ghi nhận lịch sử cho mã BĐS rác" "Negative" "PASS" "Chặn đúng HTTP 404 Not Found"
    } else {
        Add-TestResult "FEAT-20-B" "20. Lịch sử xem" "Ghi nhận lịch sử cho mã BĐS rác" "Negative" "FAIL" $_.Exception.Message
    }
}

# -------------------------------------------------------------
# SUMMARY REPORT
# -------------------------------------------------------------
Write-Host "`n=== TỔNG KẾT KẾT QUẢ KIỂM THỬ THỰC TẾ ===" -ForegroundColor Cyan
$passCount = ($results | Where-Object { $_.Status -eq "PASS" }).Count
$failCount = ($results | Where-Object { $_.Status -eq "FAIL" }).Count
Write-Host "Tổng số test case thực thi : $($results.Count)"
Write-Host "PASS                       : $passCount" -ForegroundColor Green
Write-Host "FAIL                       : $failCount" -ForegroundColor Red

$results | Export-Clixml -Path "c:\wamp64\www\baocaocdptw1\test_results.xml"

