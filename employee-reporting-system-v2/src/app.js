/* =========================================================
   KONFIGURASI - ISI SEBELUM DEPLOY (lihat langkah setup)
   ========================================================= */
const CONFIG = {
  SUPABASE_URL: "YOUR_SUPABASE_URL",
  SUPABASE_ANON_KEY: "YOUR_SUPABASE_ANON_KEY",
  CLOUDINARY_CLOUD_NAME: "YOUR_CLOUDINARY_CLOUD_NAME",
  CLOUDINARY_UPLOAD_PRESET: "YOUR_CLOUDINARY_UPLOAD_PRESET"
};
const sb = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
let currentData = [];
let currentDataHadir = [];
let isAdmin = false;
let activeTab = 'kegiatan';
let currentReport = null;
let currentReportId = null;

function switchTab(tab){
  activeTab = tab;
  document.getElementById('tabKegiatan').style.display = tab==='kegiatan' ? 'block' : 'none';
  document.getElementById('tabHadir').style.display = tab==='hadir' ? 'block' : 'none';
  document.getElementById('tabBtnKegiatan').className = tab==='kegiatan' ? 'btn-primary' : 'btn-ghost';
  document.getElementById('tabBtnHadir').className = tab==='hadir' ? 'btn-primary' : 'btn-ghost';
  if(getBulan()){ tab==='hadir' ? muatDataHadir() : muatData(); }
}

/* ---------- Dropdown Bulan (format selalu identik di semua device, tidak lagi rawan salah ketik) ---------- */
const BULAN_NAMES = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
function initBulanSelects(){
  const selNama = document.getElementById('bulan_nama');
  const selTahun = document.getElementById('bulan_tahun');
  selNama.innerHTML = BULAN_NAMES.map(b=>'<option value="'+b+'">'+b+'</option>').join('');
  const nowYear = new Date().getFullYear();
  let yearOpts = '';
  for(let y=nowYear-1; y<=nowYear+2; y++) yearOpts += '<option value="'+y+'">'+y+'</option>';
  selTahun.innerHTML = yearOpts;
}
initBulanSelects();
function getBulan(){
  return document.getElementById('bulan_nama').value+' '+document.getElementById('bulan_tahun').value;
}
function setBulan(str){
  const parts = (str||'').trim().split(/\s+/);
  if(parts.length<2) return;
  const nm = parts[0], yr = parts[1];
  if(BULAN_NAMES.includes(nm)) document.getElementById('bulan_nama').value = nm;
  if(/^\d{4}$/.test(yr)){
    const sel = document.getElementById('bulan_tahun');
    if(![...sel.options].some(o=>o.value===yr)){
      const opt = document.createElement('option'); opt.value = yr; opt.textContent = yr;
      sel.appendChild(opt);
    }
    sel.value = yr;
  }
}
function sortBulanList(list){
  return list.sort((a,b)=>{
    const [an,ay] = a.split(' '); const [bn,by] = b.split(' ');
    if(ay!==by) return Number(ay)-Number(by);
    return BULAN_NAMES.indexOf(an)-BULAN_NAMES.indexOf(bn);
  });
}

/* ---------- (Admin) Muat daftar nama pegawai: autocomplete + dropdown (simple, muat sampai ratusan nama) ---------- */
async function loadNamaList(){
  if(!isAdmin) return;
  const card = document.getElementById('adminNamaCard');
  const sel = document.getElementById('adminNamaSelect');
  const cardHadir = document.getElementById('adminNamaCardHadir');
  const selHadir = document.getElementById('adminNamaSelectHadir');
  card.style.display = 'block'; cardHadir.style.display = 'block';
  try{
    const { data: employees, error } = await sb.from('employees')
      .select('id,user_id,name,department,position').order('name',{ascending:true});
    if(error) throw error;
    const rows=(employees||[]).filter(e=>e.name);
    document.getElementById('namaListOptions').innerHTML = rows.map(e=>
      '<option value="'+String(e.name).replace(/"/g,'&quot;')+'">').join('');
    if(!rows.length){
      const msg='<option value="">Belum ada data pegawai</option>';
      sel.innerHTML=msg; selHadir.innerHTML=msg; return;
    }
    const namaAktif=document.getElementById('nama').value.trim();
    const opts='<option value="">— Semua Pegawai ('+rows.length+' orang) —</option>'+rows.map(e=>
      '<option value="'+String(e.name).replace(/"/g,'&quot;')+'">'+e.name+'</option>').join('');
    sel.innerHTML=opts; selHadir.innerHTML=opts; sel.value=namaAktif; selHadir.value=namaAktif;
  }catch(e){
    const msg='<option value="">Gagal memuat: '+e.message+'</option>';
    sel.innerHTML=msg; selHadir.innerHTML=msg;
  }
}
async function pilihPegawaiDariSelect(nama){
  document.getElementById('adminNamaSelect').value=nama;
  document.getElementById('adminNamaSelectHadir').value=nama;
  document.getElementById('nama').value=nama;
  if(!nama){
    currentEmployee=null; currentReport=null; currentReportId=null;
    document.getElementById('employee_department').value='';
    document.getElementById('employee_position').value='';
    saveInfo();
    if(getBulan()){ await muatData(); await muatDataHadir(); }
    return;
  }
  try{
    const {data:selectedEmployee,error}=await sb.from('employees').select('id,user_id,name,department,position')
      .eq('name',nama).limit(1).maybeSingle();
    if(error) throw error;
    if(selectedEmployee){
      currentEmployee=selectedEmployee;
      document.getElementById('employee_department').value=selectedEmployee.department||'';
      document.getElementById('employee_position').value=selectedEmployee.position||'';
    }
  }catch(e){ console.warn('Profil employee pilihan admin tidak dapat dimuat:',e); }
  saveInfo();
  if(!getBulan()){ alert('Isi Bulan dulu (di atas), baru pilih nama pegawai.'); return; }
  await (activeTab==='hadir' ? muatDataHadir() : muatData());
}

/* ---------- Profil employee dari Supabase ---------- */
let currentEmployee = null;

/* ---------- Login / recovery password / sesi ---------- */
let recoveryMode = false;

function hideAuthCards(){
  document.getElementById('loginCard').style.display='none';
  document.getElementById('forgotPasswordCard').style.display='none';
  document.getElementById('resetPasswordCard').style.display='none';
}

function showLoginCard(){
  recoveryMode = false;
  hideAuthCards();
  document.getElementById('loginCard').style.display='block';
  document.getElementById('appContent').style.display='none';
  const rs=document.getElementById('recoveryStatus');
  if(rs) rs.textContent='';
  const ps=document.getElementById('resetStatus');
  if(ps) ps.textContent='';
}

function showForgotPassword(){
  hideAuthCards();
  document.getElementById('forgotPasswordCard').style.display='block';
  document.getElementById('appContent').style.display='none';
  document.getElementById('recovery_email').focus();
}

function showResetPassword(){
  recoveryMode = true;
  hideAuthCards();
  document.getElementById('resetPasswordCard').style.display='block';
  document.getElementById('appContent').style.display='none';
  document.getElementById('new_password').focus();
}

async function sendPasswordRecovery(){
  const email = document.getElementById('recovery_email').value.trim();
  const st = document.getElementById('recoveryStatus');
  const btn = document.getElementById('btnSendRecovery');
  if(!email){ alert('Masukkan email akun terlebih dahulu.'); return; }
  if(!email.includes('@')){ alert('Format email belum benar.'); return; }
  btn.disabled=true;
  st.textContent='Mengirim link reset...';
  try{
    const redirectTo = window.location.origin + window.location.pathname;
    const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo });
    if(error) throw error;
    st.textContent='Link reset sudah dikirim. Periksa email Anda.';
  }catch(e){
    st.textContent='';
    alert('Gagal mengirim link reset: '+e.message);
  }finally{
    btn.disabled=false;
  }
}

async function updateNewPassword(){
  const p1=document.getElementById('new_password').value;
  const p2=document.getElementById('new_password_confirm').value;
  const st=document.getElementById('resetStatus');
  const btn=document.getElementById('btnUpdatePassword');
  if(p1.length<8){ alert('Password baru minimal 8 karakter.'); return; }
  if(p1!==p2){ alert('Konfirmasi password tidak sama.'); return; }
  btn.disabled=true;
  st.textContent='Menyimpan password baru...';
  try{
    const { error } = await sb.auth.updateUser({ password:p1 });
    if(error) throw error;
    st.textContent='Password berhasil diperbarui.';
    await sb.auth.signOut();
    recoveryMode=false;
    history.replaceState(null, '', window.location.pathname + window.location.search);
    alert('Password berhasil diperbarui. Silakan login menggunakan password baru.');
    showLoginCard();
  }catch(e){
    st.textContent='';
    alert('Gagal memperbarui password: '+e.message);
  }finally{
    btn.disabled=false;
  }
}

async function doLogin(){
  const user = document.getElementById('login_user').value.trim();
  const pass = document.getElementById('login_pass').value;
  const st = document.getElementById('loginStatus');

  if(!user || !pass){
    alert('Isi email/username dan password.');
    return;
  }

  st.textContent = 'Memproses...';

  // Jika input sudah berupa email, pakai email Supabase apa adanya.
  // Username lama tetap didukung dengan domain internal.
  const email = user.includes('@')
    ? user.toLowerCase()
    : user.toLowerCase() + '@laporan.internal';

  const { error } = await sb.auth.signInWithPassword({
    email,
    password: pass
  });

  if(error){
    st.textContent = '';
    console.error('Supabase login error:', error);

    alert(
      'Login gagal.\n\n' +
      'Pesan Supabase: ' + (error.message || 'Unknown error') +
      '\n\n' +
      'Jika akun dibuat menggunakan email asli, masukkan email lengkap, misalnya: nama@gmail.com'
    );
    return;
  }

  st.textContent = '';
  recoveryMode = false;
  await showApp();
}
async function doLogout(){
  await sb.auth.signOut();
  location.reload();
}
async function showApp(){
  document.getElementById('loginCard').style.display='none';
  document.getElementById('appContent').style.display='block';

  // 1. Ambil user yang sedang login dari Supabase Auth
  const { data:{ user }, error: userError } = await sb.auth.getUser();
  if(userError || !user){
    console.error('Gagal mengambil user:', userError);
    alert('Sesi login tidak ditemukan. Silakan login kembali.');
    return;
  }

  // 2. Ambil profil employee berdasarkan user.id
  //    Struktur ini mengikuti alur: Auth user -> employees.user_id -> data employee.
  const { data: employee, error: employeeError } = await sb
    .from('employees')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if(employeeError || !employee){
    console.error('Gagal mengambil data employee:', employeeError);
    alert('Data pegawai untuk akun ini belum ditemukan di tabel employees.\n\nPastikan kolom user_id pada tabel employees berisi user.id dari Supabase Auth.');
    return;
  }

  // 3. Simpan profil employee agar bisa dipakai oleh fitur lain
  currentEmployee = employee;

  // Field yang digunakan mengikuti contoh pada dokumentasi: id, name, department, position.
  const employeeName = employee.name || '';
  const employeeDepartment = employee.department || '';
  const employeePosition = employee.position || '';

  // 4. Tampilkan data employee di frontend
  document.getElementById('nama').value = employeeName;
  document.getElementById('employee_department').value = employeeDepartment;
  document.getElementById('employee_position').value = employeePosition;

  const uname = user?.user_metadata?.username || '';
  isAdmin = user?.app_metadata?.role === 'admin';

  document.getElementById('whoami').textContent =
    uname ? ('Masuk sebagai '+uname+(isAdmin?' (Admin)':'')) : employeeName;

  // Pegawai biasa menggunakan data employee dari akun login.
  // Admin tetap dapat memilih pegawai melalui kontrol admin yang sudah ada.
  document.getElementById('nama').readOnly = !isAdmin;

  document.getElementById('ppkSaveRow').style.display = isAdmin ? 'flex' : 'none';
  document.getElementById('ppkNonAdminNote').style.display = isAdmin ? 'none' : 'block';
  document.getElementById('btnHapusSemuaKegiatan').style.display = isAdmin ? 'inline-block' : 'none';
  document.getElementById('btnHapusSemuaHadir').style.display = isAdmin ? 'inline-block' : 'none';
  document.getElementById('hapusBulanKegiatan').style.display = isAdmin ? 'inline-block' : 'none';
  document.getElementById('hapusBulanHadir').style.display = isAdmin ? 'inline-block' : 'none';
  ['ppk_nama','ppk_jabatan','ppk_nip'].forEach(id=>document.getElementById(id).disabled = !isAdmin);

  await loadPPKInfo();
  if(isAdmin) await loadNamaList();
  if(isAdmin) await loadBulanHapusList();
  if(isAdmin) document.getElementById('adminReviewCard').style.display='block';
  if(getBulan()) { await muatData(); await muatDataHadir(); if(isAdmin) await loadAdminDashboard(); }
}

sb.auth.onAuthStateChange((event)=>{
  if(event==='PASSWORD_RECOVERY'){
    showResetPassword();
  }
});

window.addEventListener('load', async ()=>{
  const hash = window.location.hash || '';
  const isRecoveryUrl = /(?:^|&)type=recovery(?:&|$)/.test(hash);
  const { data:{ session } } = await sb.auth.getSession();
  if(isRecoveryUrl || recoveryMode){
    showResetPassword();
    return;
  }
  if(session) showApp();
});

/* ---------- Info kop laporan (localStorage, ringan) ---------- */
try{
  const info = localStorage.getItem('laporan_info');
  if(info){
    const o = JSON.parse(info);
    document.getElementById('judul').value = o.judul||'LAPORAN KEGIATAN';
    document.getElementById('judul_hadir').value = o.judul_hadir||'DAFTAR HADIR';
    document.getElementById('subjudul').value = o.subjudul||'';
    document.getElementById('nama').value = o.nama||'';
    setBulan(o.bulan||'');
    document.getElementById('jadwal').value = o.jadwal||'';
  } else { document.getElementById('judul').value = 'LAPORAN KEGIATAN'; document.getElementById('judul_hadir').value = 'DAFTAR HADIR'; }
}catch(e){ console.warn('load info gagal', e); }

function saveInfo(){
  try{
    localStorage.setItem('laporan_info', JSON.stringify({
      judul: document.getElementById('judul').value,
      judul_hadir: document.getElementById('judul_hadir').value,
      subjudul: document.getElementById('subjudul').value,
      nama: document.getElementById('nama').value,
      bulan: getBulan(),
      jadwal: document.getElementById('jadwal').value
    }));
  }catch(e){}
}
['judul','judul_hadir','subjudul','nama','jadwal'].forEach(id=>document.getElementById(id).addEventListener('input', saveInfo));

/* ---------- Info PPK (tersimpan di Supabase, berlaku sama di semua device) ---------- */
async function loadPPKInfo(){
  try{
    const { data, error } = await sb.from('pengaturan_ppk').select('*').eq('id', 1).maybeSingle();
    if(error) throw error;
    if(data){
      document.getElementById('ppk_nama').value = data.ppk_nama || '';
      document.getElementById('ppk_jabatan').value = data.ppk_jabatan || '';
      document.getElementById('ppk_nip').value = data.ppk_nip || '';
    }
  }catch(e){ console.warn('Gagal memuat info PPK dari server:', e.message); }
}
async function simpanPPKInfo(){
  const st = document.getElementById('ppkStatus');
  const ppk_nama = document.getElementById('ppk_nama').value.trim();
  const ppk_jabatan = document.getElementById('ppk_jabatan').value.trim();
  const ppk_nip = document.getElementById('ppk_nip').value.trim();
  st.textContent = 'Menyimpan...';
  try{
    const { error } = await sb.from('pengaturan_ppk').upsert({ id:1, ppk_nama, ppk_jabatan, ppk_nip, updated_at:new Date().toISOString() });
    if(error) throw error;
    st.textContent = 'Tersimpan untuk semua device.';
    setTimeout(()=>{ if(st.textContent==='Tersimpan untuk semua device.') st.textContent=''; }, 3000);
  }catch(e){
    st.textContent = '';
    alert('Gagal menyimpan info PPK: '+e.message);
  }
}

/* ---------- Reports: satu report aktif untuk satu employee + tahun + bulan ---------- */
function getYearMonth(){
  const monthIndex=BULAN_NAMES.indexOf(document.getElementById('bulan_nama').value);
  return {year:Number(document.getElementById('bulan_tahun').value),month:monthIndex+1};
}
async function getCurrentReport(employeeId,year,month){
  if(!employeeId) return null;
  const {data,error}=await sb.from('reports').select('*').eq('employee_id',employeeId)
    .eq('year',year).eq('month',month).maybeSingle();
  if(error) throw error; return data||null;
}
async function createReport(employeeId,year,month){
  const {data,error}=await sb.from('reports').insert({employee_id:employeeId,year,month,status:'draft'}).select().single();
  if(error) throw error; return data;
}
async function ensureCurrentReport(){
  if(!currentEmployee?.id) throw new Error('Data employee belum tersedia.');
  const {year,month}=getYearMonth();
  let report=await getCurrentReport(currentEmployee.id,year,month);
  if(!report) report=await createReport(currentEmployee.id,year,month);
  currentReport=report; currentReportId=report.id; return report;
}
async function refreshCurrentReport(){
  if(!getBulan()) return;
  if(activeTab==='hadir') await muatDataHadir(); else await muatData();
  if(isAdmin) await loadAdminDashboard();
}

/* ---------- Perubahan filter Bulan/Tahun ----------
   Dashboard admin harus selalu membaca periode terbaru dari dropdown.
   Handler ini sengaja memuat dashboard secara langsung, lalu memuat tab aktif.
   Ini menghindari ketergantungan pada state/report sebelumnya saat bulan diganti. */
async function onBulanChange(){
  saveInfo();
  const periode = getBulan();
  if(!periode) return;

  const holder = document.getElementById('adminReportHolder');
  if(isAdmin && holder){
    holder.innerHTML = '<div class="empty">Memuat dashboard untuk '+periode+'...</div>';
  }

  try{
    // Reset state report agar tidak membawa report dari bulan sebelumnya.
    currentReport = null;
    currentReportId = null;
    currentData = [];
    currentDataHadir = [];

    // Dashboard memakai year/month langsung dari dropdown yang baru dipilih.
    if(isAdmin) await loadAdminDashboard();

    // Setelah dashboard diperbarui, muat data tab aktif untuk pegawai yang sedang dipilih.
    if(activeTab==='hadir') await muatDataHadir();
    else await muatData();

    if(isAdmin) await loadAdminDashboard();
  }catch(e){
    console.error('Gagal memperbarui filter bulan:', e);
    if(holder) holder.innerHTML = '<div class="empty">Gagal memuat dashboard: '+e.message+'</div>';
  }
}

/* ---------- Muat data dari Supabase berdasar Nama+Bulan ---------- */
async function muatData(){
  saveInfo();
  const bulan=getBulan(), nama=document.getElementById('nama').value.trim(), st=document.getElementById('loadStatus');
  if(!bulan){alert('Pilih Bulan dulu.');return;}
  st.textContent='Memuat report...';
  try{
    let employee=currentEmployee;
    if(!employee && nama){
      const {data,error}=await sb.from('employees').select('id,user_id,name,department,position').eq('name',nama).limit(1).maybeSingle();
      if(error) throw error; employee=data;
    }
    if(!employee){
      currentReport=null; currentReportId=null;
      const {data,error}=await sb.from('activities').select('*').order('activity_date',{ascending:true}).order('activity_time',{ascending:true});
      if(error) throw error; currentData=data||[]; renderTable(); st.textContent=currentData.length+' kegiatan dimuat.'; return;
    }
    currentEmployee=employee;
    const {year,month}=getYearMonth();
    currentReport=await getCurrentReport(employee.id,year,month); currentReportId=currentReport?.id||null;
    updateReportStatusUI(currentReport);
    if(!currentReport){currentData=[];renderTable();st.textContent='Belum ada report untuk '+employee.name+' pada '+bulan+'.';return;}
    const {data,error}=await sb.from('activities').select('*').eq('report_id',currentReport.id)
      .order('activity_date',{ascending:true}).order('activity_time',{ascending:true});
    if(error) throw error; currentData=data||[]; renderTable();
    st.textContent=currentData.length+' kegiatan dimuat dari report #'+currentReport.id+'.';
  }catch(e){st.textContent='';alert('Gagal memuat report/kegiatan: '+e.message);}
}
async function muatDataHadir(){
  saveInfo(); const bulan=getBulan(), nama=document.getElementById('nama').value.trim(); if(!bulan)return;
  try{
    let employee=currentEmployee;
    if(!employee && nama){
      const {data,error}=await sb.from('employees').select('id,user_id,name,department,position').eq('name',nama).limit(1).maybeSingle();
      if(error) throw error; employee=data;
    }
    if(!employee){currentDataHadir=[];renderTableHadir();return;}
    currentEmployee=employee;
    const {year,month}=getYearMonth();
    currentReport=await getCurrentReport(employee.id,year,month); currentReportId=currentReport?.id||null;
    updateReportStatusUI(currentReport);
    if(!currentReport){currentDataHadir=[];renderTableHadir();return;}
    const {data,error}=await sb.from('attendance').select('*').eq('report_id',currentReport.id)
      .order('attendance_date',{ascending:true});
    if(error) throw error; currentDataHadir=data||[]; renderTableHadir();
  }catch(e){alert('Gagal memuat data kehadiran: '+e.message);}
}

function updateReportStatusUI(report){
  const controls=document.getElementById('reportControls');
  const badge=document.getElementById('reportStatus');
  const btn=document.getElementById('btnSubmitReport');
  const note=document.getElementById('revisionNote');
  if(!controls || !badge || !btn) return;
  controls.style.display=report?'flex':'none';
  if(!report){ badge.textContent='Draft'; badge.className='report-status status-draft'; return; }
  const status=report.status||'draft';
  badge.textContent=status.charAt(0).toUpperCase()+status.slice(1);
  badge.className='report-status status-'+status;
  btn.style.display=(status==='draft'||status==='revision')?'inline-block':'none';
  btn.textContent=status==='revision'?'📤 Kirim Ulang':'📤 Kirim Laporan';
  if(note){
    note.style.display=status==='revision'?'block':'none';
    note.textContent=status==='revision'?'Report dikembalikan untuk revisi. Silakan perbaiki data lalu kirim ulang.':'';
  }
}

async function submitReport(reportId){
  if(!reportId) throw new Error('Report ID tidak tersedia.');
  const {error}=await sb.from('reports').update({status:'submitted',submitted_at:new Date().toISOString()}).eq('id',reportId);
  if(error) throw error;
}

async function submitCurrentReport(){
  const st=document.getElementById('reportActionStatus');
  try{
    const report=await ensureCurrentReport();
    if(!['draft','revision'].includes(report.status||'draft')){ alert('Report dengan status '+report.status+' tidak dapat dikirim.'); return; }
    if(!confirm('Kirim laporan ini untuk diperiksa admin?')) return;
    st.textContent='Mengirim...';
    await submitReport(report.id);
    currentReport=await getCurrentReport(report.employee_id,report.year,report.month);
    currentReportId=currentReport?.id||null;
    updateReportStatusUI(currentReport);
    st.textContent='Laporan berhasil dikirim.';
    if(isAdmin) await loadAdminDashboard();
  }catch(e){st.textContent='';alert('Gagal mengirim laporan: '+e.message);}
}

/* ---------- Upload & kompres foto, lalu unggah ke Cloudinary ---------- */
let pendingBlob = null;
function resizeToBlob(file, cb){
  const reader = new FileReader();
  reader.onload = e=>{
    const img = new Image();
    img.onload = ()=>{
      const maxW = 900;
      const scale = Math.min(1, maxW/img.width);
      const canvas = document.createElement('canvas');
      canvas.width = img.width*scale; canvas.height = img.height*scale;
      canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);
      canvas.toBlob(blob=>cb(blob, canvas.toDataURL('image/jpeg',0.75)), 'image/jpeg', 0.8);
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}
function setupFileBox(){
  const inp = document.getElementById('f_foto');
  const box = document.getElementById('box_foto');
  inp.addEventListener('change', ()=>{
    if(!inp.files[0]) return;
    resizeToBlob(inp.files[0], (blob, previewUrl)=>{
      pendingBlob = blob;
      box.innerHTML = '<img src="'+previewUrl+'">';
      const newInput = document.createElement('input');
      newInput.type='file'; newInput.accept='image/*'; newInput.id='f_foto';
      newInput.style.cssText='position:absolute;inset:0;opacity:0;cursor:pointer;';
      box.appendChild(newInput);
      setupFileBox();
    });
  });
}
setupFileBox();

/* ---------- Upload foto ganda (datang & pulang) untuk Kehadiran ---------- */
let pendingBlobDatang = null, pendingBlobPulang = null;
function setupHadirBox(boxId, inputId, which){
  const inp = document.getElementById(inputId);
  const box = document.getElementById(boxId);
  inp.addEventListener('change', ()=>{
    if(!inp.files[0]) return;
    resizeToBlob(inp.files[0], (blob, previewUrl)=>{
      if(which==='datang') pendingBlobDatang = blob; else pendingBlobPulang = blob;
      box.innerHTML = '<img src="'+previewUrl+'">';
      const newInput = document.createElement('input');
      newInput.type='file'; newInput.accept='image/*'; newInput.id=inputId;
      newInput.style.cssText='position:absolute;inset:0;opacity:0;cursor:pointer;';
      box.appendChild(newInput);
      setupHadirBox(boxId, inputId, which);
    });
  });
}
setupHadirBox('box_foto_datang','fh_foto_datang','datang');
setupHadirBox('box_foto_pulang','fh_foto_pulang','pulang');

async function uploadToCloudinary(blob){
  const fd = new FormData();
  fd.append('file', blob);
  fd.append('upload_preset', CONFIG.CLOUDINARY_UPLOAD_PRESET);
  const res = await fetch('https://api.cloudinary.com/v1_1/'+CONFIG.CLOUDINARY_CLOUD_NAME+'/image/upload', { method:'POST', body:fd });
  const json = await res.json();
  if(!res.ok) throw new Error(json.error?.message || 'Upload gagal');
  return json.secure_url;
}

/* ---------- CRUD data kegiatan ---------- */
async function tambahData(){
  const nama = document.getElementById('nama').value.trim();
  const bulan = getBulan();
  const tanggal = document.getElementById('f_tanggal').value;
  const desk = document.getElementById('f_desk').value;
  const st = document.getElementById('addStatus');
  const btn = document.getElementById('btnTambah');
  if(!bulan){ alert('Pilih Bulan di Kop Laporan dulu, lalu klik "Muat Data".'); return; }
  if(!tanggal || !desk){ alert('Mohon isi tanggal dan uraian kegiatan.'); return; }
  btn.disabled = true;
  try{
    let fotoUrl = '';
    if(pendingBlob){
      st.textContent = 'Mengunggah foto...';
      fotoUrl = await uploadToCloudinary(pendingBlob);
    }
    st.textContent = 'Menyiapkan report...';
    const report = await ensureCurrentReport();
    st.textContent = 'Menyimpan data...';
    const activityTime = new Date().toISOString();
    const { error } = await sb.from('activities').insert({
      report_id: report.id,
      activity_date: tanggal,
      activity_time: activityTime,
      description: desk,
      photo_url: fotoUrl
    });
    if(error) throw error;
    st.textContent = 'Tersimpan.';
    document.getElementById('f_desk').value='';
    document.getElementById('f_tanggal').value='';
    const box = document.getElementById('box_foto');
    box.innerHTML = 'Tap untuk upload foto<input type="file" accept="image/*" id="f_foto" style="position:absolute;inset:0;opacity:0;cursor:pointer;">';
    pendingBlob = null;
    setupFileBox();
    await muatData();
    updateReportStatusUI(currentReport);
    if(isAdmin) await loadAdminDashboard();
  }catch(e){
    st.textContent='';
    alert('Gagal menyimpan: '+e.message);
  }finally{ btn.disabled = false; }
}
async function hapusBaris(id){
  try{
    const { error } = await sb.from('activities').delete().eq('id', id);
    if(error) throw error;
    await muatData();
  }catch(e){ alert('Gagal menghapus: '+e.message); }
}
async function loadBulanHapusList(){
  if(!isAdmin)return;
  const selK=document.getElementById('hapusBulanKegiatan'),selH=document.getElementById('hapusBulanHadir');
  try{
    const {data:reports,error}=await sb.from('reports').select('id,year,month'); if(error)throw error;
    const list=sortBulanList([...new Set((reports||[]).map(r=>BULAN_NAMES[Number(r.month)-1]+' '+r.year))]);
    const cur=getBulan(),html=list.length?list.map(b=>'<option value="'+b+'">'+b+'</option>').join(''):'<option value="">(belum ada report)</option>';
    selK.innerHTML=html;selH.innerHTML=html;if(list.includes(cur)){selK.value=cur;selH.value=cur;}
  }catch(e){selK.innerHTML='<option value="">Gagal memuat</option>';selH.innerHTML='<option value="">Gagal memuat</option>';}
}
/* ---------- (Admin) Hapus semua data untuk 1 bulan pilihan dari dropdown (bukan otomatis ikut Bulan di atas) ---------- */
async function hapusSemuaBulan(jenis){
  if(!isAdmin){alert('Hanya admin yang bisa menghapus semua data.');return;}
  const selId=jenis==='kegiatan'?'hapusBulanKegiatan':'hapusBulanHadir',bulanPilihan=document.getElementById(selId).value;
  if(!bulanPilihan){alert('Pilih dulu bulan yang mau dihapus.');return;}
  const [nm,ys]=bulanPilihan.split(' '),year=Number(ys),month=BULAN_NAMES.indexOf(nm)+1;
  const label=jenis==='kegiatan'?'Kegiatan':'Kehadiran';
  if(!confirm('Hapus SEMUA '+label+' untuk '+bulanPilihan+'? Tindakan ini tidak bisa dibatalkan.'))return;
  try{
    const {data:reports,error:repError}=await sb.from('reports').select('id').eq('year',year).eq('month',month); if(repError)throw repError;
    const ids=(reports||[]).map(r=>r.id);
    if(ids.length){const table=jenis==='kegiatan'?'activities':'attendance';const {error}=await sb.from(table).delete().in('report_id',ids);if(error)throw error;}
    if(jenis==='kegiatan')await muatData();else await muatDataHadir();
    alert('Data '+label+' untuk '+bulanPilihan+' berhasil dihapus.');
  }catch(e){alert('Gagal menghapus: '+e.message);}
}
function fmtTgl(t){
  if(!t) return '-';
  const d = new Date(t+'T00:00:00');
  return String(d.getDate()).padStart(2,'0')+'/'+String(d.getMonth()+1).padStart(2,'0')+'/'+d.getFullYear();
}
function renderTable(){
  document.getElementById('count').textContent = currentData.length;
  const holder = document.getElementById('tableHolder');
  if(currentData.length===0){ holder.innerHTML = '<div class="empty">Belum ada data untuk Nama+Bulan ini.</div>'; return; }
  let html = '<table><thead><tr><th>No</th><th>Tanggal</th><th>Jam</th><th>Dokumentasi Kegiatan</th><th>Uraian Kegiatan</th><th></th></tr></thead><tbody>';
  currentData.forEach((d,i)=>{
    html += '<tr><td>'+(i+1)+'</td><td>'+fmtTgl(d.activity_date || d.tanggal)+'</td><td>'+(d.activity_time||'')+'</td>'
      + '<td class="imgcell">'+((d.photo_url||d.foto_url)?'<img src="'+(d.photo_url||d.foto_url)+'">':'<span class="small">(tanpa foto)</span>')+'</td>'
      + '<td class="desk">'+(d.description || d.uraian || d.keterangan || '')+'</td>'
      + '<td><button class="btn-danger" onclick="hapusBaris('+d.id+')">Hapus</button></td></tr>';
  });
  html += '</tbody></table>';
  holder.innerHTML = html;
}

/* ---------- CRUD data Kehadiran (Datang/Pulang) ---------- */
async function tambahDataHadir(){
  const nama = document.getElementById('nama').value.trim();
  const bulan = getBulan();
  const tanggal = document.getElementById('fh_tanggal').value;
  const st = document.getElementById('addStatusHadir');
  const btn = document.getElementById('btnTambahHadir');
  if(!bulan){ alert('Pilih Bulan di Kop Laporan dulu.'); return; }
  if(!tanggal){ alert('Mohon isi tanggal.'); return; }
  btn.disabled = true;
  try{
    let fotoDatangUrl = '', fotoPulangUrl = '';
    if(pendingBlobDatang){ st.textContent = 'Mengunggah foto datang...'; fotoDatangUrl = await uploadToCloudinary(pendingBlobDatang); }
    if(pendingBlobPulang){ st.textContent = 'Mengunggah foto pulang...'; fotoPulangUrl = await uploadToCloudinary(pendingBlobPulang); }
    st.textContent = 'Menyiapkan report...';
    const report = await ensureCurrentReport();
    st.textContent = 'Menyimpan data...';
    const { error } = await sb.from('attendance').upsert({
      report_id: report.id,
      attendance_date: tanggal,
      check_in_photo: fotoDatangUrl,
      check_in_time: new Date().toISOString()
    }, {onConflict:'report_id,attendance_date'});
    if(error) throw error;
    st.textContent = 'Tersimpan.';
    document.getElementById('fh_tanggal').value='';
    const boxD = document.getElementById('box_foto_datang');
    boxD.innerHTML = 'Tap untuk upload foto<input type="file" accept="image/*" id="fh_foto_datang" style="position:absolute;inset:0;opacity:0;cursor:pointer;">';
    const boxP = document.getElementById('box_foto_pulang');
    boxP.innerHTML = 'Tap untuk upload foto<input type="file" accept="image/*" id="fh_foto_pulang" style="position:absolute;inset:0;opacity:0;cursor:pointer;">';
    pendingBlobDatang = null; pendingBlobPulang = null;
    setupHadirBox('box_foto_datang','fh_foto_datang','datang');
    setupHadirBox('box_foto_pulang','fh_foto_pulang','pulang');
    await muatDataHadir();
    updateReportStatusUI(currentReport);
    if(isAdmin) await loadAdminDashboard();
  }catch(e){
    st.textContent='';
    alert('Gagal menyimpan: '+e.message);
  }finally{ btn.disabled = false; }
}
async function pulangAttendance(attendanceId){
  try{
    let fotoUrl='';
    const inp=document.getElementById('checkout_'+attendanceId);
    if(inp?.files?.[0]){
      fotoUrl=await uploadToCloudinary(inp.files[0]);
    }
    const {error}=await sb.from('attendance').update({
      check_out_photo:fotoUrl,
      check_out_time:new Date().toISOString()
    }).eq('id',attendanceId);
    if(error) throw error;
    await muatDataHadir();
  }catch(e){alert('Gagal menyimpan kepulangan: '+e.message);}
}

async function hapusBarisHadir(id){
  try{
    const { error } = await sb.from('attendance').delete().eq('id', id);
    if(error) throw error;
    await muatDataHadir();
  }catch(e){ alert('Gagal menghapus: '+e.message); }
}
function renderTableHadir(){
  document.getElementById('countHadir').textContent = currentDataHadir.length;
  const holder = document.getElementById('tableHolderHadir');
  if(currentDataHadir.length===0){ holder.innerHTML = '<div class="empty">Belum ada data untuk Nama+Bulan ini.</div>'; return; }
  let html = '<table><thead><tr><th>No</th><th>Tanggal</th><th>Data Dukung Kehadiran Datang</th><th>Data Dukung Kehadiran Pulang</th><th>Aksi</th></tr></thead><tbody>';
  currentDataHadir.forEach((d,i)=>{
    const checkoutAction=d.check_out_time
      ? '<div class="small">'+new Date(d.check_out_time).toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'})+'</div>'
      : '<input id="checkout_'+d.id+'" type="file" accept="image/*" style="max-width:150px;margin-bottom:4px"><br><button class="btn-ghost" onclick="pulangAttendance('+d.id+')">Simpan Pulang</button>';
    html += '<tr><td>'+(i+1)+'</td><td>'+fmtTgl(d.attendance_date || d.tanggal)+'</td>'
      + '<td class="imgcell">'+((d.check_in_photo||d.foto_datang_url)?'<img src="'+(d.check_in_photo||d.foto_datang_url)+'">':'<span class="small">(tanpa foto)</span>')+'</td>'
      + '<td class="imgcell">'+((d.check_out_photo||d.foto_pulang_url)?'<img src="'+(d.check_out_photo||d.foto_pulang_url)+'">':'<span class="small">(tanpa foto)</span>')+'</td>'
      + '<td>'+checkoutAction+'<br><button class="btn-danger" onclick="hapusBarisHadir('+d.id+')">Hapus</button></td></tr>';
  });
  html += '</tbody></table>';
  holder.innerHTML = html;
}
async function loadAdminDashboard(){
  const holder=document.getElementById('adminReportHolder');
  if(!isAdmin || !holder) return;
  try{
    const {year,month}=getYearMonth();
    const periodLabel=document.getElementById('adminPeriodLabel');
    if(periodLabel) periodLabel.textContent='Periode aktif: '+BULAN_NAMES[month-1]+' '+year;
    const {data,error}=await sb.from('reports').select(`id,year,month,status,submitted_at,employee:employees(id,employee_number,name,department,position),activities(id),attendance(id)`).eq('year',year).eq('month',month);
    if(error) throw error;
    const rows=data||[];
    if(!rows.length){holder.innerHTML='<div class="empty">Belum ada report untuk periode ini.</div>';return;}
    let html='<table><thead><tr><th>Pegawai</th><th>Department</th><th>Position</th><th>Status</th><th>Kegiatan</th><th>Attendance</th><th>Aksi</th></tr></thead><tbody>';
    rows.forEach(r=>{
      const e=r.employee||{};
      html+='<tr><td class="desk">'+(e.name||'-')+'</td><td>'+(e.department||'-')+'</td><td>'+(e.position||'-')+'</td><td>'+(r.status||'draft')+'</td><td>'+((r.activities||[]).length)+'</td><td>'+((r.attendance||[]).length)+'</td><td>'
        +((r.status==='submitted')?'<button class="btn-primary" onclick="reviewReport('+JSON.stringify(r.id)+',\'approved\')">Approve</button> <button class="btn-ghost" onclick="reviewReport('+JSON.stringify(r.id)+',\'revision\')">Revision</button>':'-')+'</td></tr>';
    });
    html+='</tbody></table>'; holder.innerHTML=html;
  }catch(e){holder.innerHTML='<div class="empty">Gagal memuat dashboard: '+e.message+'</div>';}
}

async function reviewReport(reportId,status){
  if(!isAdmin) return;
  if(!['approved','revision'].includes(status)) return;
  const label=status==='approved'?'Approve':'Request Revision';
  if(!confirm(label+' report ini?')) return;
  try{
    const {error}=await sb.from('reports').update({status}).eq('id',reportId);
    if(error) throw error;
    await loadAdminDashboard();
    if(currentReportId===reportId){
      currentReport=await sb.from('reports').select('*').eq('id',reportId).single().then(r=>r.data);
      updateReportStatusUI(currentReport);
    }
  }catch(e){alert('Gagal mengubah status report: '+e.message);}
}


/* ---------- Helper foto untuk Word ---------- */
/*
  Foto di database V2 memakai:
  - activities.photo_url
  - attendance.check_in_photo / check_out_photo

  docx.js menerima image data sebagai Uint8Array/ArrayBuffer.
  Kita gunakan Uint8Array agar konsisten di browser.
*/
async function getWordImage(url){
  if(!url) return null;

  let imageUrl = String(url).trim();

  // Cloudinary: paksa format JPEG agar format yang diberikan ke docx.js
  // selalu cocok dengan byte gambar yang diunduh.
  if(imageUrl.includes('/image/upload/') && !imageUrl.includes('/f_jpg/')){
    imageUrl = imageUrl.replace('/image/upload/', '/image/upload/f_jpg/');
  }

  const res = await fetch(imageUrl, {
    method: 'GET',
    mode: 'cors',
    cache: 'no-store'
  });

  if(!res.ok){
    throw new Error('Foto tidak dapat diambil (HTTP '+res.status+').');
  }

  const contentType = (res.headers.get('content-type') || '').toLowerCase();
  const bytes = new Uint8Array(await res.arrayBuffer());

  if(!bytes.length){
    throw new Error('Data foto kosong.');
  }

  let type = 'jpg';
  if(contentType.includes('png')) type = 'png';
  else if(contentType.includes('gif')) type = 'gif';
  else if(contentType.includes('bmp')) type = 'bmp';
  else if(contentType.includes('jpeg') || contentType.includes('jpg')) type = 'jpg';

  return { data: bytes, type };
}

async function fotoParagraphWord(url, width=160, height=120){
  // Fungsi ini berada di scope global, sedangkan Paragraph/ImageRun/TextRun
  // sebelumnya hanya didefinisikan sebagai const lokal di unduhWord().
  // Ambil constructor langsung dari object docx agar tidak terkena
  // ReferenceError: Paragraph is not defined.
  if(typeof docx === 'undefined') throw new Error('Library docx.js belum dimuat.');

  const { Paragraph, ImageRun, TextRun, AlignmentType } = docx;

  if(!url) return new Paragraph('-');

  try{
    const image = await getWordImage(url);
    return new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new ImageRun({
          data: image.data,
          type: image.type,
          transformation: { width, height }
        })
      ]
    });
  }catch(e){
    console.error('Gagal memuat foto untuk Word:', url, e);
    return new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: '(foto gagal dimuat)',
          size: 18
        })
      ]
    });
  }
}

async function unduhWord(){
  if(currentData.length===0){ alert('Belum ada data untuk diunduh. Klik "Muat Data" dulu.'); return; }
  if(typeof docx === 'undefined'){
    alert('Library pembuat Word (docx.js) gagal dimuat dari internet. Cek koneksi internet Anda lalu coba lagi. Kalau masih gagal, beri tahu Claude.');
    return;
  }
  let judul, subjudul, nama, bulan, jadwal, ppkNama, ppkJabatan, ppkNip, btn;
  try{
    const { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, ImageRun,
            WidthType, AlignmentType, VerticalAlign, BorderStyle, HeadingLevel,
            Header, Tab, TabStopType } = docx;

    judul = document.getElementById('judul').value || 'LAPORAN KEGIATAN';
    subjudul = document.getElementById('subjudul').value || '';
    nama = document.getElementById('nama').value || '-';
    bulan = getBulan() || '-';
    jadwal = (document.getElementById('jadwal').value || '').split('\n').filter(x=>x.trim()!=='');
    ppkNama = document.getElementById('ppk_nama').value || '';
    ppkJabatan = document.getElementById('ppk_jabatan').value || '';
    ppkNip = document.getElementById('ppk_nip').value || '';

    btn = document.querySelector('button[onclick="unduhWord()"]');
    if(btn) btn.disabled = true;
    const noBorder = { style: BorderStyle.NONE, size:0, color:"FFFFFF" };
    // Lebar kolom tetap (dalam DXA/twips, 1440 = 1 inci). Total ~9350 dxa = lebar halaman Letter dikurangi margin 1 inci kanan-kiri.
    const COL_WIDTHS = [700, 1500, 3200, 3950];
    const cell = (children, colIdx, opts={}) => new TableCell({
      children, verticalAlign: VerticalAlign.CENTER,
      ...(typeof colIdx === 'number' ? { width: { size: COL_WIDTHS[colIdx], type: WidthType.DXA } } : {}),
      ...opts
    });
    const p = (text, opts={}) => new Paragraph({ children:[new TextRun({text, ...opts})], alignment: opts.alignment||AlignmentType.CENTER });

    const headerRow = new TableRow({ tableHeader:true, children:[
      cell([p('No', {bold:true})], 0),
      cell([p('Tanggal', {bold:true})], 1),
      cell([p('Dokumentasi Kegiatan', {bold:true})], 2),
      cell([p('Uraian Kegiatan', {bold:true})], 3),
    ]});

    // Nama/Bulan/Jadwal di halaman pertama: teks biasa (bukan tabel), tampil sebagai bagian isi dokumen.
    const PAGE_CONTENT_WIDTH = 9020; // twips, lebar isi halaman A4 (default docx.js) dikurangi margin 1 inci kanan-kiri
    const tabLine = (left, right) => new Paragraph({
      tabStops: [{ type: TabStopType.RIGHT, position: PAGE_CONTENT_WIDTH }],
      children: [ new TextRun(left||''), new TextRun({children:[new Tab()]}), new TextRun(right||'') ]
    });
    const jumlahBarisInfo = Math.max(2, jadwal.length);
    const infoLinesHalaman1 = [];
    for(let i=0;i<jumlahBarisInfo;i++){
      const kiri = i===0 ? ('Nama : '+nama) : i===1 ? ('Bulan : '+bulan) : '';
      const kanan = jadwal[i] || '';
      infoLinesHalaman1.push(tabLine(kiri, kanan));
    }

    // Header halaman: kosong di halaman pertama (karena info sudah ada di isi/body),
    // lalu otomatis muncul ulang berisi Nama+Bulan saja (tanpa jadwal) di halaman kedua dan seterusnya.
    const headerHalamanPertama = new Header({ children: [ new Paragraph('') ] });
    const headerHalamanBerikutnya = new Header({ children: [
      new Paragraph({ children:[ new TextRun('Nama : '+nama) ] }),
      new Paragraph({ children:[ new TextRun('Bulan : '+bulan) ] }),
    ]});

    const dataRows = [];
    for(let i=0;i<currentData.length;i++){
      const d = currentData[i];
      const imgPara = await fotoParagraphWord(
        d.photo_url || d.foto_url,
        160,
        120
      );
      dataRows.push(new TableRow({ children:[
        cell([p(String(i+1))], 0),
        cell([p(fmtTgl(d.tanggal))], 1),
        cell([imgPara], 2),
        cell([new Paragraph({ children:[new TextRun(d.description || d.uraian || d.keterangan || '')] })], 3),
      ]}));
    }

    const mainTable = new Table({
      width:{ size:100, type:WidthType.PERCENTAGE },
      columnWidths: COL_WIDTHS,
      rows:[headerRow, ...dataRows]
    });

    const SIG_COL_WIDTHS = [4675, 4675];
    const sigCell = (children) => new TableCell({
      children, verticalAlign: VerticalAlign.CENTER,
      width: { size: 4675, type: WidthType.DXA }
    });
    const sigTable = new Table({
      width:{ size:100, type:WidthType.PERCENTAGE },
      columnWidths: SIG_COL_WIDTHS,
      borders:{ top:noBorder, bottom:noBorder, left:noBorder, right:noBorder, insideHorizontal:noBorder, insideVertical:noBorder },
      rows:[ new TableRow({ children:[
        sigCell([
          p('Yang Membuat Laporan,'),
          new Paragraph(''), new Paragraph(''), new Paragraph(''), new Paragraph(''),
          p(nama, {underline:{}})
        ]),
        sigCell([
          p('Mengetahui,'), p((ppkJabatan||'PPK')+','),
          new Paragraph(''), new Paragraph(''), new Paragraph(''),
          p(ppkNama||' ', {underline:{}}),
          ...(ppkJabatan?[p(ppkJabatan)]:[]),
          ...(ppkNip?[p('NIP. '+ppkNip)]:[])
        ]),
      ]})]
    });

    const doc = new Document({ sections:[{
      properties: { titlePage: true },
      headers: { first: headerHalamanPertama, default: headerHalamanBerikutnya },
      children:[
        new Paragraph({ alignment: AlignmentType.CENTER, children:[new TextRun({text:judul, bold:true, size:28})] }),
        ...(subjudul?[new Paragraph({ alignment: AlignmentType.CENTER, children:[new TextRun({text:subjudul, size:22})] })]:[]),
        new Paragraph(''),
        ...infoLinesHalaman1,
        new Paragraph(''),
        mainTable,
        new Paragraph(''), new Paragraph(''),
        sigTable
      ]
    }]});

    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Laporan_Kegiatan_'+(nama||'pegawai').replace(/\s+/g,'_')+'_'+(bulan||'').replace(/\s+/g,'_')+'.docx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }catch(e){
    console.error('Gagal membuat file Word:', e); alert('Gagal membuat file Word: '+e.message);
  }finally{ if(btn) btn.disabled = false; }
}

/* ---------- Export ke Word: Daftar Hadir (Kedatangan & Kepulangan) - dokumen terpisah ---------- */
async function unduhWordHadir(){
  if(currentDataHadir.length===0){ alert('Belum ada data kehadiran untuk diunduh.'); return; }
  if(typeof docx === 'undefined'){ alert('Library pembuat Word (docx.js) gagal dimuat dari internet.'); return; }
  let judul, subjudul, nama, bulan, jadwal, ppkNama, ppkJabatan, ppkNip, btn;
  try{
    const { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, ImageRun,
            WidthType, AlignmentType, VerticalAlign, BorderStyle, Header, Tab, TabStopType } = docx;

    judul = document.getElementById('judul_hadir').value || 'DAFTAR HADIR';
    subjudul = document.getElementById('subjudul').value || '';
    nama = document.getElementById('nama').value || '-';
    bulan = getBulan() || '-';
    jadwal = (document.getElementById('jadwal').value || '').split('\n').filter(x=>x.trim()!=='');
    ppkNama = document.getElementById('ppk_nama').value || '';
    ppkJabatan = document.getElementById('ppk_jabatan').value || '';
    ppkNip = document.getElementById('ppk_nip').value || '';

    btn = document.querySelector('button[onclick="unduhWordHadir()"]');
    if(btn) btn.disabled = true;

    const COL_WIDTHS = [600, 1400, 3500, 3500];
    const cell = (children, colIdx) => new TableCell({ children, verticalAlign: VerticalAlign.CENTER, width:{ size: COL_WIDTHS[colIdx], type: WidthType.DXA } });
    const p = (text, opts={}) => new Paragraph({ children:[new TextRun({text, ...opts})], alignment: opts.alignment||AlignmentType.CENTER });

    const headerRow = new TableRow({ tableHeader:true, children:[
      cell([p('No', {bold:true})], 0),
      cell([p('Tanggal', {bold:true})], 1),
      cell([p('Data Dukung Kehadiran Datang', {bold:true})], 2),
      cell([p('Data Dukung Kehadiran Pulang', {bold:true})], 3),
    ]});

    const PAGE_CONTENT_WIDTH = 9020;
    const tabLine = (left, right) => new Paragraph({
      tabStops: [{ type: TabStopType.RIGHT, position: PAGE_CONTENT_WIDTH }],
      children: [ new TextRun(left||''), new TextRun({children:[new Tab()]}), new TextRun(right||'') ]
    });
    const jumlahBarisInfo = Math.max(2, jadwal.length);
    const infoLinesHalaman1 = [];
    for(let i=0;i<jumlahBarisInfo;i++){
      const kiri = i===0 ? ('Nama : '+nama) : i===1 ? ('Bulan : '+bulan) : '';
      infoLinesHalaman1.push(tabLine(kiri, jadwal[i] || ''));
    }
    const headerHalamanPertama = new Header({ children:[ new Paragraph('') ] });
    const headerHalamanBerikutnya = new Header({ children:[
      new Paragraph({ children:[ new TextRun('Nama : '+nama) ] }),
      new Paragraph({ children:[ new TextRun('Bulan : '+bulan) ] }),
    ]});

    const dataRows = [];
    for(let i=0;i<currentDataHadir.length;i++){
      const d = currentDataHadir[i];
      const fotoDatang = await fotoParagraphWord(
        d.check_in_photo || d.foto_datang_url,
        150,
        150
      );
      const fotoPulang = await fotoParagraphWord(
        d.check_out_photo || d.foto_pulang_url,
        150,
        150
      );
      dataRows.push(new TableRow({ children:[
        cell([p(String(i+1))], 0),
        cell([p(fmtTgl(d.tanggal))], 1),
        cell([fotoDatang], 2),
        cell([fotoPulang], 3),
      ]}));
    }

    const mainTable = new Table({ width:{ size:100, type:WidthType.PERCENTAGE }, columnWidths: COL_WIDTHS, rows:[headerRow, ...dataRows] });

    // Sesuai permintaan: tanda tangan "Yang Membuat Laporan" dihapus, hanya "Mengetahui, PPK" saja.
    // Dibungkus tabel 2 kolom tanpa border (sama seperti Laporan Kegiatan Harian) supaya blok PPK berada di sebelah kanan, bukan di tengah halaman.
    const noBorder = { style: BorderStyle.NONE, size:0, color:"FFFFFF" };
    const SIG_COL_WIDTHS = [4675, 4675];
    const sigCell = (children) => new TableCell({
      children, verticalAlign: VerticalAlign.CENTER,
      width: { size: 4675, type: WidthType.DXA }
    });
    const sigTable = new Table({
      width:{ size:100, type:WidthType.PERCENTAGE },
      columnWidths: SIG_COL_WIDTHS,
      borders:{ top:noBorder, bottom:noBorder, left:noBorder, right:noBorder, insideHorizontal:noBorder, insideVertical:noBorder },
      rows:[ new TableRow({ children:[
        sigCell([ new Paragraph('') ]),
        sigCell([
          p('Mengetahui,'), p((ppkJabatan||'PPK')+','),
          new Paragraph(''), new Paragraph(''), new Paragraph(''),
          p(ppkNama||' ', {underline:{}}),
          ...(ppkJabatan?[p(ppkJabatan)]:[]),
          ...(ppkNip?[p('NIP. '+ppkNip)]:[])
        ]),
      ]})]
    });

    const doc = new Document({ sections:[{
      properties: { titlePage: true },
      headers: { first: headerHalamanPertama, default: headerHalamanBerikutnya },
      children:[
        new Paragraph({ alignment: AlignmentType.CENTER, children:[new TextRun({text:judul, bold:true, size:28})] }),
        ...(subjudul?[new Paragraph({ alignment: AlignmentType.CENTER, children:[new TextRun({text:subjudul, size:22})] })]:[]),
        new Paragraph(''),
        ...infoLinesHalaman1,
        new Paragraph(''),
        mainTable,
        new Paragraph(''), new Paragraph(''),
        sigTable
      ]
    }]});

    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Daftar_Hadir_'+(nama||'pegawai').replace(/\s+/g,'_')+'_'+(bulan||'').replace(/\s+/g,'_')+'.docx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }catch(e){
    console.error('Gagal membuat file Word:', e); alert('Gagal membuat file Word: '+e.message);
  }finally{ if(btn) btn.disabled = false; }
}
