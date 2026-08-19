import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Column,
  Section,
  Text,
} from "@react-email/components";
import type { ReactNode } from "react";
import { SITE_URL } from "@/lib/site-url";

const CORAIL = "#E8734A";
const JAUNE = "#F5B942";
const SAUGE = "#8BA888";
const CREME = "#FFF8F0";
const TEXTE = "#4A3529";
const TEXTE_DOUX = "#8A7263";
const BORDURE = "#F2DFC9";

// Mise en page partagée par les 4 emails transactionnels, voir CLAUDE.md >
// "Emails transactionnels" — même logique que PageLegale/LiensLegaux pour
// les pages web : un seul endroit pour la charte (logo, palette, pied de
// page légal), jamais un design par email.
export default function EmailLayout({
  preview,
  children,
}: {
  preview: string;
  children: ReactNode;
}) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ backgroundColor: CREME, margin: 0, padding: 0, fontFamily: "Helvetica, Arial, sans-serif" }}>
        <Row>
          <Column style={{ backgroundColor: CORAIL, height: 6, width: "50%" }} />
          <Column style={{ backgroundColor: JAUNE, height: 6, width: "33%" }} />
          <Column style={{ backgroundColor: SAUGE, height: 6, width: "17%" }} />
        </Row>
        <Container style={{ maxWidth: 560, margin: "0 auto", padding: "32px 24px" }}>
          <Row style={{ margin: "0 0 28px", width: "auto" }}>
            <Column style={{ verticalAlign: "middle", paddingRight: 8 }}>
              <Img
                src={`${SITE_URL}/logo-email.png`}
                width={32}
                height={32}
                alt="Kdovie"
              />
            </Column>
            <Column style={{ verticalAlign: "middle" }}>
              <Text style={{ fontSize: 24, fontWeight: 700, color: CORAIL, margin: 0 }}>
                kdovie
              </Text>
            </Column>
          </Row>

          <Section
            style={{
              backgroundColor: "#ffffff",
              borderRadius: 24,
              border: `2px solid ${BORDURE}`,
              padding: "32px",
            }}
          >
            {children}
          </Section>

          <Hr style={{ borderColor: BORDURE, margin: "32px 0 16px" }} />

          <Text style={{ fontSize: 13, color: TEXTE_DOUX, textAlign: "center", margin: 0 }}>
            © 2026 Kdovie ·{" "}
            <Link href={`${SITE_URL}/mentions-legales`} style={{ color: TEXTE_DOUX }}>
              Mentions légales
            </Link>{" "}
            ·{" "}
            <Link href={`${SITE_URL}/cgu`} style={{ color: TEXTE_DOUX }}>
              CGU
            </Link>{" "}
            ·{" "}
            <Link href={`${SITE_URL}/cgv`} style={{ color: TEXTE_DOUX }}>
              CGV
            </Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export const emailStyles = {
  titre: { fontSize: 22, fontWeight: 700, color: TEXTE, margin: "0 0 16px" },
  texte: { fontSize: 16, lineHeight: "24px", color: TEXTE, margin: "0 0 16px" },
  texteDoux: { fontSize: 14, lineHeight: "22px", color: TEXTE_DOUX, margin: "0 0 16px" },
  bouton: {
    display: "inline-block",
    backgroundColor: CORAIL,
    color: CREME,
    fontWeight: 700,
    fontSize: 16,
    padding: "14px 28px",
    borderRadius: 16,
    textDecoration: "none",
    margin: "8px 0",
  },
  boutonSecondaire: {
    display: "inline-block",
    backgroundColor: CREME,
    color: TEXTE,
    fontWeight: 700,
    fontSize: 15,
    padding: "12px 24px",
    borderRadius: 16,
    textDecoration: "none",
    margin: "8px 8px 8px 0",
    border: `2px solid ${BORDURE}`,
  },
  lienDiscret: {
    display: "inline-block",
    color: TEXTE_DOUX,
    fontSize: 13,
    textDecoration: "underline",
    margin: "20px 0 0",
  },
};
