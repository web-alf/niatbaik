// Public landing page. Ported from _legacy_src/public/public-app.jsx (PublicApp).
// openCampaign(slug) → navigate('/c/' + slug); 'home' stays on this route (scroll top).
import { useNavigate } from 'react-router-dom';
import {
  Navbar, Hero, TrustStrip, StatsSection, CampaignsSection, HowToSection,
  TestimonialsSection, FAQ, FinalCTA, Footer, SocialPopup, StickyCTA, getFirstCampaign,
} from './_components';

export default function LandingPage() {
  const navigate = useNavigate();
  // Every campaign open goes through the REAL router (navigate → /c/<slug>); the landing
  // page itself only ever shows "home", so there's no local campaign sub-view here.
  // onNav handles 'campaign' (route out) + 'home' (stay/scroll-top) only.
  const onNav = (name: any, data: any) => {
    if (name === 'campaign') {
      const slug = (data && typeof data === 'object') ? (data.slug || data.id) : data;
      if (slug) navigate('/c/' + slug);
      return;
    }
    // 'home' (and anything else): we're already on the landing route — just scroll to top.
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar onNav={onNav}/>
      <main className="flex-1 pb-24 lg:pb-0">
        <Hero onNav={onNav}/>
        <TrustStrip/>
        <StatsSection/>
        <CampaignsSection onNav={onNav}/>
        <HowToSection/>
        <TestimonialsSection/>
        <FAQ/>
        <FinalCTA onNav={onNav}/>
        <Footer/>
      </main>
      <SocialPopup/>
      <StickyCTA onClick={() => onNav('campaign', getFirstCampaign())}/>
    </div>
  );
}
