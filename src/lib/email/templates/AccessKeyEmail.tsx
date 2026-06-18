import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

export interface AccessKeyEmailProps {
  name: string;
  workshopTitle: string;
  accessKey: string;
  loginEmail: string;
  passwordTemp: string;
  baseUrl: string;
}

/**
 * Template del email transaccional que recibe el alumno cuando el admin
 * lo crea y genera su clave de acceso para un taller.
 */
export default function AccessKeyEmail({
  name,
  workshopTitle,
  accessKey,
  loginEmail,
  passwordTemp,
  baseUrl,
}: AccessKeyEmailProps) {
  const loginUrl = `${baseUrl}/auth/login`;

  return (
    <Html lang="es">
      <Head />
      <Preview>Tu acceso al taller {workshopTitle} en SDIH Talleres</Preview>
      <Body style={body}>
        <Container style={container}>
          <Heading as="h1" style={brand}>
            Salazar Duke Impact Hub
          </Heading>

          <Heading as="h2" style={h2}>
            ¡Hola {name}! Tu acceso está listo.
          </Heading>

          <Text style={text}>
            Te creamos una cuenta para que ingreses al taller{" "}
            <strong>{workshopTitle}</strong>.
          </Text>

          <Section style={keyBox}>
            <Text style={keyLabel}>Tu clave de acceso al taller:</Text>
            <Text style={keyCode}>{accessKey}</Text>
          </Section>

          <Hr style={hr} />

          <Heading as="h3" style={h3}>
            Cómo entrar al portal
          </Heading>
          <Text style={text}>
            <strong>1.</strong> Ingresá a{" "}
            <a href={loginUrl} style={link}>
              {loginUrl}
            </a>
          </Text>
          <Text style={text}>
            <strong>2.</strong> Usá tus credenciales temporales:
          </Text>
          <Section style={credBox}>
            <Text style={credLine}>
              <strong>Email:</strong> {loginEmail}
            </Text>
            <Text style={credLine}>
              <strong>Contraseña temporal:</strong> {passwordTemp}
            </Text>
          </Section>
          <Text style={text}>
            <strong>3.</strong> El sistema te va a pedir cambiar la contraseña
            la primera vez que entres.
          </Text>
          <Text style={text}>
            <strong>4.</strong> En el catálogo, hacé click en{" "}
            <em>Ingresar</em> sobre <strong>{workshopTitle}</strong> y pegá tu
            clave de acceso de arriba.
          </Text>

          <Section style={ctaBox}>
            <Button href={loginUrl} style={button}>
              Ingresar al portal
            </Button>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            Si no esperabas este email, podés ignorarlo. Tu cuenta no se
            activa hasta que ingreses la primera vez.
          </Text>
          <Text style={footer}>— El equipo de SDIH Talleres</Text>
        </Container>
      </Body>
    </Html>
  );
}

const body = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
};

const container = {
  margin: "40px auto",
  padding: "24px",
  backgroundColor: "#ffffff",
  borderRadius: "8px",
  maxWidth: "560px",
};

const brand = {
  fontSize: "14px",
  fontWeight: "600",
  letterSpacing: "0.08em",
  textTransform: "uppercase" as const,
  color: "#0891b2",
  margin: "0 0 16px 0",
};

const h2 = {
  fontSize: "22px",
  fontWeight: "700",
  color: "#0f172a",
  margin: "0 0 16px 0",
};

const h3 = {
  fontSize: "16px",
  fontWeight: "600",
  color: "#0f172a",
  margin: "20px 0 8px 0",
};

const text = {
  fontSize: "15px",
  lineHeight: "1.55",
  color: "#334155",
  margin: "8px 0",
};

const keyBox = {
  backgroundColor: "#ecfeff",
  border: "1px solid #67e8f9",
  borderRadius: "8px",
  padding: "20px",
  margin: "20px 0",
  textAlign: "center" as const,
};

const keyLabel = {
  fontSize: "13px",
  color: "#475569",
  margin: "0 0 8px 0",
};

const keyCode = {
  fontSize: "28px",
  fontWeight: "700",
  letterSpacing: "0.05em",
  fontFamily: "Menlo, Consolas, monospace",
  color: "#0891b2",
  margin: 0,
};

const credBox = {
  backgroundColor: "#f1f5f9",
  borderRadius: "6px",
  padding: "12px 16px",
  margin: "8px 0",
};

const credLine = {
  fontSize: "14px",
  color: "#0f172a",
  margin: "4px 0",
  fontFamily: "Menlo, Consolas, monospace",
};

const ctaBox = {
  textAlign: "center" as const,
  margin: "28px 0",
};

const button = {
  backgroundColor: "#0891b2",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "600",
  padding: "12px 28px",
  borderRadius: "6px",
  textDecoration: "none",
  display: "inline-block",
};

const link = {
  color: "#0891b2",
  textDecoration: "underline",
};

const hr = {
  border: "none",
  borderTop: "1px solid #e2e8f0",
  margin: "24px 0",
};

const footer = {
  fontSize: "12px",
  color: "#94a3b8",
  margin: "4px 0",
};
