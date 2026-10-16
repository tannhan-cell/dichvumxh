import { createFileRoute, Link } from '@tanstack/react-router';
import { AnnouncementBar } from '@/components/AnnouncementBar';
import { ShopSection } from '@/components/ShopSection';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ContactLinks } from '@/components/ContactLinks';
import { useState } from 'react';
import { ArrowUpRight, ArrowRight, Zap, ShieldCheck, LockKeyhole, Check, Menu, X, MessageCircle, Facebook, Instagram, Music2, Youtube, Sparkles, BadgeCheck, Lock, Headphones } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import heroImage from '@/assets/social-hero.jpg';

export const Route = createFileRoute('/')({
  head: () => ({ meta: [
    { title: 'SocialMedia — Dịch vụ MXH & Mở khóa tài khoản' },
    { name: 'description', content: 'Giải pháp tương tác Facebook, TikTok, Instagram và hỗ trợ khôi phục, bảo mật tài khoản cùng SocialMedia.' },
    { property: 'og:title', content: 'SocialMedia — Dịch vụ MXH & Mở khóa tài khoản' },
    { property: 'og:description', content: 'Dịch vụ tương tác và hỗ trợ khôi phục tài khoản mạng xã hội.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: Index,
});

const engagement = [
  { name:'Facebook', icon:Facebook, tone:'facebook', tag:'ĐƯỢC QUAN TÂM', description:'Tăng Like, Follow, thành viên nhóm, chia sẻ và mắt xem Livestream cực nhanh.', features:['Like & Follow','Thành viên nhóm','Livestream'] },
  { name:'TikTok', icon:Music2, tone:'tiktok', tag:'XU HƯỚNG', description:'Tăng tym, follow, đẩy xu hướng video và tăng mắt xem live giúp kênh phát triển.', features:['Tym & Follow','Xu hướng video','Mắt xem Live'] },
  { name:'Instagram', icon:Instagram, tone:'instagram', tag:'XÂY DỰNG UY TÍN', description:'Tăng tym, follow thực giúp tài khoản uy tín hơn và nâng tầm hình ảnh trên Instagram.', features:['Tym bài viết','Follow','Tương tác'] },
];
const unlock = [
  { name:'Mở khóa Facebook', icon:LockKeyhole, tone:'unlock', tag:'KHÔI PHỤC', description:'Hỗ trợ tài khoản bị khóa 180 ngày, két sắt tím, bị hack, đổi mail, trình tạo mã hoặc vô hiệu hóa.', features:['Khóa 180 ngày','Tài khoản bị hack','Vô hiệu hóa'] },
  { name:'Mở khóa TikTok', icon:Music2, tone:'unlock', tag:'KHÔI PHỤC', description:'Hỗ trợ khôi phục tài khoản bị đình chỉ, vi phạm chính sách hoặc bị cấm livestream.', features:['Đình chỉ tài khoản','Cấm Livestream','Vi phạm chính sách'] },
  { name:'Bảo mật tài khoản', icon:ShieldCheck, tone:'unlock', tag:'BẢO VỆ', description:'Dịch vụ chống hack, cài đặt bảo mật 2 lớp và bảo vệ bản quyền nội dung của bạn.', features:['Bảo mật 2 lớp','Chống hack','Bản quyền nội dung'] },
];
type Service = (typeof engagement)[number];
function Brand() { return <a className="brand" href="#home" aria-label="SocialMedia trang chủ"><span className="brand-symbol"><Zap size={22} fill="currentColor" /></span><span>Social<span>Media</span><span className="text-primary">.</span></span></a>; }
function ServiceCard({ service, onSelect }: { service:Service; onSelect:(s:Service)=>void }) {
  const Icon = service.icon;
  return <article className="service-card">
    <div className="service-top"><span className={`platform-icon ${service.tone}`}><Icon fill={service.tone === 'facebook' ? 'currentColor' : 'none'} /></span><span className={`service-tag ${service.tone === 'facebook' || service.tone === 'unlock' ? 'highlight' : ''}`}>{service.tag}</span></div>
    <h3>{service.name}</h3><p>{service.description}</p>
    <div className="service-features">{service.features.map(f=><span key={f}>{f}</span>)}</div>
    <Button variant="ghost" className="service-link" onClick={()=>onSelect(service)}>Khám phá dịch vụ <ArrowUpRight /></Button>
  </article>;
}
const NAME_TO_PLATFORM: Record<string,string> = { Facebook:'facebook', TikTok:'tiktok', Instagram:'instagram' };
function Index() {
  const [menuOpen,setMenuOpen]=useState(false);
  const [info,setInfo]=useState<'support'|'terms'|null>(null);
  const [platform,setPlatform]=useState('facebook');
  const setSelected=(s:Service|null)=>{ if(!s) return; setPlatform(NAME_TO_PLATFORM[s.name] ?? 'unlock'); document.getElementById('dat-don')?.scrollIntoView({behavior:'smooth'}); };
  return <>
    <AnnouncementBar />
    <header className="site-header"><div className="page-shell header-inner"><Brand />
      <nav className="desktop-nav" aria-label="Điều hướng chính"><a className="active" href="#home">Trang chủ</a><a href="#dat-don">Đặt đơn</a><a href="#tuong-tac">Dịch vụ tương tác</a><a href="#mo-khoa">Mở khóa tài khoản</a><Link to="/tra-cuu">Tra cứu đơn</Link></nav>
      <div className="header-actions"><ThemeToggle /><Button variant="premium" className="header-consult" onClick={()=>setInfo('support')}><MessageCircle /> Tư vấn ngay <ArrowUpRight /></Button><Button variant="ghost" size="icon" className="mobile-menu-button" aria-label={menuOpen?'Đóng menu':'Mở menu'} aria-expanded={menuOpen} onClick={()=>setMenuOpen(!menuOpen)}>{menuOpen?<X />:<Menu />}</Button></div>
    </div>{menuOpen&&<nav className="mobile-nav" aria-label="Điều hướng di động">{[['#home','Trang chủ'],['#dat-don','Đặt đơn'],['#tuong-tac','Dịch vụ tương tác'],['#mo-khoa','Mở khóa tài khoản']].map(([href,label])=><a key={href} href={href} onClick={()=>setMenuOpen(false)}>{label}</a>)}<Button variant="premium" onClick={()=>{setMenuOpen(false);setInfo('support');}}>Tư vấn ngay <ArrowUpRight /></Button></nav>}</header>
    <main>
      <section className="hero" id="home"><img className="hero-art" src={heroImage} width={1536} height={1024} alt="Biểu tượng Facebook, TikTok, Instagram và khiên bảo mật bằng kính cao cấp" fetchPriority="high" /><div className="page-shell hero-inner">
        <div className="eyebrow hero-label"><span className="status-dot" /> GIẢI PHÁP MẠNG XÃ HỘI CHUYÊN NGHIỆP</div>
        <h1><span className="brand-title">SocialMedia</span>Bứt phá tương tác.<br />Vững vàng kết nối.</h1>
        <p className="hero-description">Nâng tầm hiện diện trên mạng xã hội với dịch vụ tương tác và hỗ trợ khôi phục tài khoản. Uy tín, tốc độ và bảo mật.</p>
        <div className="hero-buttons"><Button asChild variant="premium"><a href="#dat-don">Đặt đơn ngay <ArrowUpRight /></a></Button><Button asChild variant="glass"><a href="#mo-khoa"><LockKeyhole /> Mở khóa tài khoản</a></Button></div>
        <div className="hero-notes"><span><ShieldCheck /> Bảo mật thông tin</span><span><Zap /> Xử lý nhanh chóng</span><span><Headphones /> Hỗ trợ tận tâm</span></div>
      </div></section>
      <div className="platform-bar"><div className="page-shell platform-inner"><span className="platform-caption">Đồng hành cùng bạn trên<br />các nền tảng hàng đầu</span><span className="platform-word"><Facebook size={25} fill="currentColor" />facebook</span><span className="platform-word"><Music2 size={26} />TikTok</span><span className="platform-word instagram"><Instagram size={23} />Instagram</span><span className="platform-word youtube"><Youtube size={29} fill="currentColor" />YouTube</span></div></div>
      <ShopSection platform={platform} setPlatform={setPlatform} />
      <section className="page-shell services-section" id="tuong-tac"><div className="section-heading"><div><span className="eyebrow"><span className="section-number">01 /</span> KẾT NỐI & PHÁT TRIỂN</span><h2>Dịch vụ tương tác<span className="text-primary">.</span></h2></div><p>Tiếp cận nhiều hơn. Tương tác mạnh hơn.<br />Đưa thương hiệu của bạn tiến xa hơn.</p></div><div className="service-grid">{engagement.map(s=><ServiceCard key={s.name} service={s} onSelect={setSelected} />)}</div></section>
      <section className="unlock-band" id="mo-khoa"><div className="page-shell services-section"><div className="section-heading"><div><span className="eyebrow"><span className="section-number">02 /</span><span className="unlock-heading-icon"><Lock size={12} /> KHÔI PHỤC & BẢO VỆ</span></span><h2>Lấy lại kết nối. Giữ vững an tâm<span className="text-primary">.</span></h2></div><p>Hỗ trợ khôi phục tài khoản và tăng cường<br />bảo mật cho hành trình của bạn.</p></div><div className="service-grid">{unlock.map(s=><ServiceCard key={s.name} service={s} onSelect={setSelected} />)}</div><div className="security-line"><ShieldCheck /> Thông tin của bạn được ưu tiên bảo mật trong suốt quá trình hỗ trợ.</div></div></section>
      <section className="contact-band"><div className="page-shell contact-inner"><div><span className="eyebrow"><Sparkles size={13} /> CÙNG BẠN TIẾN XA HƠN</span><h2>Sẵn sàng nâng tầm tài khoản của bạn?</h2><p>Khám phá giải pháp phù hợp với nhu cầu của bạn cùng SocialMedia.</p></div><Button variant="premium" size="lg" onClick={()=>setInfo('support')}><MessageCircle /> Kết nối tư vấn <ArrowUpRight /></Button></div></section>
    </main>
    <footer className="page-shell footer"><div className="footer-top"><div><Brand /><p>Uy tín · Tốc độ · Bảo mật thông tin khách hàng</p></div><div className="footer-links"><Button variant="link" onClick={()=>setInfo('terms')}>Điều khoản</Button><Button variant="link" onClick={()=>setInfo('support')}>Hỗ trợ <ArrowUpRight /></Button></div></div><div className="footer-bottom"><span>© 2026 SocialMedia. Designed by VoTanNhan.</span><span><span className="status-dot" /> Kết nối giá trị. Phát triển bền vững.</span></div></footer>
    
    <Dialog open={info!==null} onOpenChange={open=>{if(!open)setInfo(null);}}><DialogContent className="max-w-md w-[calc(100%-32px)] rounded-lg"><DialogHeader><DialogTitle>{info==='terms'?'Điều khoản dịch vụ':'Hỗ trợ SocialMedia'}</DialogTitle><DialogDescription>{info==='terms'?'Thông tin trước khi sử dụng dịch vụ':'Tư vấn dịch vụ tương tác và khôi phục tài khoản'}</DialogDescription></DialogHeader><div className="dialog-details">{info==='terms'?<><p>Thông tin trên trang giới thiệu các nhóm dịch vụ. Phạm vi, chi phí và thời gian thực hiện cần được xác nhận trước khi sử dụng.</p><p>Việc khôi phục tài khoản phụ thuộc vào tình trạng tài khoản và quyết định của nền tảng. Không cung cấp mật khẩu hoặc mã xác thực cho người khác.</p></>:<><p>Liên hệ trực tiếp với admin để được tư vấn nhanh nhất:</p><ContactLinks /></>}</div>{info==='support'&&<Button asChild variant="premium"><a href="#tuong-tac" onClick={()=>setInfo(null)}>Xem dịch vụ <ArrowUpRight /></a></Button>}</DialogContent></Dialog>
  </>;
}
