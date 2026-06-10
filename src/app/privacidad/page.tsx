import { LegalPage, LSection, LP } from "@/components/LegalPage";

export const metadata = {
  title: "Privacidad",
  description: "Aviso de privacidad de WaterSense.",
};

export default function PrivacidadPage() {
  return (
    <LegalPage title="Aviso de privacidad" updated="junio 2026">
      <LSection h="Quiénes somos">
        <LP>
          WaterSense es un prototipo de software para auditar y optimizar el riego en la agricultura de
          alto rendimiento, con base en Delicias, Chihuahua, México. Para cualquier tema de privacidad
          puedes escribirnos a <b>hola@watersense.mx</b>.
        </LP>
      </LSection>

      <LSection h="Qué datos tratamos">
        <LP>
          En esta demo, todo lo que capturas (parcelas, pozos, costos, lecturas) se guarda únicamente en
          el almacenamiento local de tu navegador. No viaja a nuestros servidores ni lo vemos.
        </LP>
        <LP>
          Cuando, en el futuro, crees una cuenta, trataremos los datos mínimos para autenticarte (correo
          electrónico o teléfono) y la información de tu rancho que tú ingreses, con el único fin de
          prestarte el servicio.
        </LP>
      </LSection>

      <LSection h="Para qué los usamos">
        <LP>
          Para operar el servicio, generar tus recomendaciones de riego y energía, y mejorar el producto.
          No vendemos tus datos ni los usamos para fines distintos a los aquí descritos.
        </LP>
      </LSection>

      <LSection h="Con quién los compartimos">
        <LP>
          Solo con proveedores de infraestructura que nos ayudan a operar (por ejemplo, alojamiento y base
          de datos), bajo sus propias obligaciones de seguridad. Las fuentes públicas que consultamos
          (clima, precio de energía) reciben ubicaciones aproximadas, nunca tus datos personales.
        </LP>
      </LSection>

      <LSection h="Tus derechos (ARCO)">
        <LP>
          Conforme a la legislación mexicana, puedes solicitar el acceso, rectificación, cancelación u
          oposición sobre tus datos personales escribiéndonos a <b>hola@watersense.mx</b>. Si tienes
          cuenta, también puedes exportar o borrar tus datos desde la aplicación.
        </LP>
      </LSection>

      <LSection h="Cambios a este aviso">
        <LP>
          Podemos actualizar este aviso conforme el producto evolucione. Publicaremos la versión vigente en
          esta página con su fecha de actualización.
        </LP>
      </LSection>
    </LegalPage>
  );
}
