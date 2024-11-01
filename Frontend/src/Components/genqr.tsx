import { useEffect, useRef } from "react";
import QRCodeStyling from "qr-code-styling";

interface QRCodeProps {
  text: string;
}

export function GenerateQRCode({ text }: QRCodeProps): JSX.Element {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const qrCode = new QRCodeStyling({
      width: 100,
      height: 100,
      image: "./lgo.png",

      dotsOptions: {
        color: "#54de87",
        type: "square",
      },
      imageOptions: {
        crossOrigin: "anonymous",
      },
    });

    if (ref.current) {
      qrCode.append(ref.current);
      qrCode.update({ data: text });
    }

    return () => {
      qrCode.deleteExtension();
    };
  }, [text]);

  return (
    <div>
      <div ref={ref} />
    </div>
  );
}
