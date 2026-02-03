import {
  type Barcode,
  barcodeCaptureLoader,
  SparkScan,
  SparkScanBarcodeErrorFeedback,
  SparkScanBarcodeSuccessFeedback,
  type SparkScanScanningMode,
  type SparkScanSession,
  SparkScanSettings,
  SparkScanView,
  type SparkScanViewState,
  type SparkScanViewUiListener,
  Symbology,
  SymbologyDescription,
} from "@scandit/web-datacapture-barcode";
import { DataCaptureContext } from "@scandit/web-datacapture-core";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { CodeItem } from "./types.ts";
import { CodesList } from "./CodeList";

SparkScanView.register();

const isValidBarcode = (barcode: Barcode) => {
  return barcode.data !== "5901234123457";
};

export function SparkScanScannerComponent() {
  const [dataCaptureContext, setDataCaptureContext] = useState<DataCaptureContext | null>(null);
  const [sparkScan, setSparkScan] = useState<SparkScan | null>(null);
  const [codes, setCodes] = useState<CodeItem[]>([]);

  const addOrUpdateCode = useCallback((newData: string, newSymbology: string) => {
    setCodes((prev) => {
      const existing = prev.find((code) => code.data === newData && code.symbology === newSymbology);

      if (existing) {
        return prev.map((code) => (code === existing ? { ...code, quantity: code.quantity + 1 } : code));
      }

      return [...prev, { data: newData, symbology: newSymbology, quantity: 1 }];
    });
  }, []);

  const clearCodes = () => setCodes([]);

  const uiViewListener: SparkScanViewUiListener = useMemo(
    () => ({
      didChangeScanningMode(_scanningMode: SparkScanScanningMode) {
        // Runs when the scanning mode changes
      },
      didChangeViewState(_state: SparkScanViewState) {
        // Runs when the view state changes
      },
      didTapBarcodeFindButton(_view: SparkScanView) {
        // Runs when the barcode find button is tapped
      },
      didTapLabelCaptureButton(_view: SparkScanView) {
        // Runs when the label capture button is tapped
      },
    }),
    []
  );

  const sparkScanListener = useMemo(
    () => ({
      didScan(_mode: SparkScan, session: SparkScanSession) {
        const barcode = session.newlyRecognizedBarcode;

        if (!barcode || !isValidBarcode(barcode)) {
          return;
        }

        const symbology = new SymbologyDescription(barcode.symbology).readableName;
        addOrUpdateCode(barcode.data || "", symbology);
      },
    }),
    [addOrUpdateCode]
  );

  const feedbackDelegate = useMemo(() => {
    return {
      getFeedbackForBarcode: (barcode: Barcode) => {
        if (isValidBarcode(barcode)) {
          return new SparkScanBarcodeSuccessFeedback();
        }
        return new SparkScanBarcodeErrorFeedback("Barcode rejected.", 60_000);
      },
    };
  }, []);

  // Initialize SDK and create SparkScan mode
  useEffect(() => {
    let isMounted = true;

    async function initialize() {
      try {
        // Enter your Scandit License key here.
        // Your Scandit License key is available via your Scandit SDK web account.
        const context = await DataCaptureContext.forLicenseKey("AtUnpRqZPcDNJN3l+N4pfyI/AtdVI/XfDTudNYM9k+z0PvtCjnW7RZpJmpx4d7xPfyWMw7JSVbAgdRSwVnmVgbYamuWCVGHESnVuaIBvcoOdHB1oyS7ZpZgcaUatXl/pFVInQBhpJMcXZB7OzG3LHBNVU/roWo1+f2NAhoxWLrwDdzWeflnlRbd472FiVoTep2cGTsJ/8MisQOalNnKPj4Bq8YCRFZLndA/d+U9wfaBnZO2uaWxAM4B8mrA8TtdTuQ2r7NFamVGWbV0VfkYZSkpyBVutcoU5rE8GIqhDNmYQeuMXV1V+tvNcqCecb+OzUnrze6xtaqpTR6uvJ3xBJ9pK0AxTLFK0BkaDs5EIhSIxXM2RZGPtLXdXhz/1SCSbtVjXO/JCI9hfaHGUBjAEG21wzgRffDqWDCEjEMVnU7ajUth5a3X/vUYvbsuuOYvtdRofL+1HA15GNkYQG0KN+bFJvLebU+tESnqPXX480NitbaMJflHxhbQWRgTXTlVVXWb3mGhVj/0yNiYMJStoVYcNeRYpAI9ECQ5FzOkTf4AWaMWztTB0DeISa98sUWbJ6XdBdcj0lU9D56t9XQxfxuaMgXBCbzeLwjrbL7EeJoSgdIXDtBC7kbpUX0shObqXGYp77Va2Pmh214R9qkNQWPIMcndfRDlgIKxZx6RYT9bGN4VymCmhsIhg4ZC2MySlqKqs54e5mTOaZWsRvrE1XJc5vNiaj4bzxep3GFLafMFzzZaEFxdrY9yam8lvcaMTsMozDOfINm/Ry8EbGYeHzEklLrD9/5uknc6noUiWQXOAHrnwbu4Et84q1ADDJ+6HOL/VJ4RvpZaD9w87cA0O/Ru7MISOxfvf3Os3rDFaXTeqizWA44BIqZy1mApcsaU7l83QaV93+ZrcrT4A010b8OhZiipfE+eUKvaFsVxz4W/Ar3MFYRaB8FYhyllImzf7Xjovrbfr6VMjOEblddMXuUHYgYQdmS3BWHN2IMjrC9a3DODJFvBnf6UF8+Kn0C8fMqHcDsUU+AgJM6yxuzZRVJSRzE9TVKvMMz/obKl5WwVEnBhn+2NhV+eOd+WhHUTEtmICayF2f6+Mk1RVE9OxNsE3m6JU+uIdkGLij/2rWYHMOu006XXbVlInYsQAt4EwS8G3oY7YZnHNNo+2KIrzPt5KD61wKpBC6GE8LmcXEPfHA8h48PuGlpP3udSwyIJe83Q=", {
          libraryLocation: new URL("library/engine/", document.baseURI).toString(),
          moduleLoaders: [barcodeCaptureLoader()],
        });

        const settings = new SparkScanSettings();
        settings.enableSymbologies([Symbology.EAN13UPCA, Symbology.Code128]);

        const mode = SparkScan.forSettings(settings);
        mode.addListener(sparkScanListener);

        if (isMounted) {
          setDataCaptureContext(context);
          setSparkScan(mode);
        }
      } catch (error) {
        console.error("SparkScan initialization failed:", error);
      }
    }

    initialize();

    return () => {
      isMounted = false;
    };
  }, [sparkScanListener]);

  return (
    <>
      {dataCaptureContext && sparkScan ? (
        <spark-scan-view
          dataCaptureContext={dataCaptureContext}
          sparkScan={sparkScan}
          feedbackDelegate={feedbackDelegate}
          ref={(view: SparkScanView | null) => {
            if (view) {
              view.setListener(uiViewListener);
            }
          }}
        />
      ) : null}
      <CodesList codes={codes} onClear={clearCodes} />
    </>
  );
}