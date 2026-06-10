import { LegalPage, LSection, LP } from "@/components/LegalPage";

export const metadata = {
  title: "Términos",
  description: "Términos y condiciones de uso de WaterSense.",
};

export default function TerminosPage() {
  return (
    <LegalPage title="Términos y condiciones" updated="junio 2026">
      <LSection h="Aceptación">
        <LP>
          Al usar WaterSense aceptas estos términos. Si no estás de acuerdo, por favor no uses el servicio.
        </LP>
      </LSection>

      <LSection h="El servicio">
        <LP>
          WaterSense es, en esta etapa, una demostración con <b>datos simulados</b> con rangos realistas de
          Chihuahua. Las cifras que muestra son ilustrativas y <b>no deben usarse para decisiones
          financieras, legales o agronómicas reales</b> hasta conectar datos verdaderos (sensores, CONAGUA,
          CENACE).
        </LP>
      </LSection>

      <LSection h="Uso aceptable">
        <LP>
          Te comprometes a usar el servicio de forma lícita y a no intentar vulnerar su seguridad, abusar de
          sus recursos ni acceder a datos de otros usuarios.
        </LP>
      </LSection>

      <LSection h="Cuentas y pagos">
        <LP>
          Cuando habilitemos cuentas y planes de pago, el precio, la prueba gratuita y la cancelación se
          regirán por lo publicado en la página de Precios al momento de tu contratación. Podrás cancelar
          cuando quieras; el servicio seguirá activo hasta el fin del periodo pagado.
        </LP>
      </LSection>

      <LSection h="Propiedad">
        <LP>
          El software, la marca y el contenido de WaterSense son nuestros. La información que tú ingresas
          sobre tu rancho es tuya; solo la usamos para prestarte el servicio.
        </LP>
      </LSection>

      <LSection h="Sin garantías y límite de responsabilidad">
        <LP>
          El servicio se ofrece “tal cual”, sin garantías. En la medida que la ley lo permita, no somos
          responsables por pérdidas derivadas de decisiones tomadas con base en información del servicio,
          especialmente mientras opere con datos simulados.
        </LP>
      </LSection>

      <LSection h="Ley aplicable">
        <LP>
          Estos términos se rigen por las leyes de México, con jurisdicción en el estado de Chihuahua. Para
          cualquier duda, escríbenos a <b>hola@watersense.mx</b>.
        </LP>
      </LSection>
    </LegalPage>
  );
}
