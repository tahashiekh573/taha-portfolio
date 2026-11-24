import { Header, type NavItem } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { BackToTop } from "@/components/site/back-to-top";
import { getSiteContent } from "@/lib/content";

export default async function SiteLayout({ children }: LayoutProps<"/">) {
  const content = await getSiteContent();
  const items: NavItem[] = [
    { id: "home", label: "Home" },
    { id: "about", label: "About" },
    ...(content.experience.some((e) => e.published) ? [{ id: "experience", label: "Experience" }] : []),
    { id: "skills", label: "Skills" },
    { id: "projects", label: "Projects" },
    ...(content.education.length ? [{ id: "education", label: "Education" }] : []),
    ...(content.certifications.some((c) => c.verified) ? [{ id: "certifications", label: "Certifications" }] : []),
    { id: "contact", label: "Contact" },
  ];
  return (
    <>
      <Header items={items} hasResume={Boolean(content.resume.url)} />
      <main id="main">{children}</main>
      <Footer profile={content.profile} />
      <BackToTop />
    </>
  );
}
