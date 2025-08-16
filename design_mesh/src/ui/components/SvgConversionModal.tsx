import React from "react";
import { SvgConversionParams } from "../constants/inventory";

interface SvgConversionModalProps {
  isOpen: boolean;
  params: SvgConversionParams;
  onParamsChange: (params: SvgConversionParams) => void;
  onConvert: () => void;
  onCancel: () => void;
  isConverting?: boolean;
}

const SvgConversionModal: React.FC<SvgConversionModalProps> = ({
  isOpen,
  params,
  onParamsChange,
  onConvert,
  onCancel,
  isConverting = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="svg-conversion-overlay">
      <div className="svg-conversion-dialog">
        <div className="svg-conversion-title">SVG Conversion Settings</div>
        <div className="svg-conversion-form">
          <div className="form-group">
            <label>Format</label>
            <select
              id="format-select"
              aria-label="Select output format"
              title="Select output format"
              value={params.format}
              onChange={(e) => onParamsChange({
                ...params,
                format: e.target.value as 'png' | 'jpeg'
              })}
              disabled={isConverting}
            >
              <option value="png">PNG</option>
              <option value="jpeg">JPEG</option>
            </select>
          </div>
          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={params.maintainAspectRatio}
                onChange={(e) => onParamsChange({
                  ...params,
                  maintainAspectRatio: e.target.checked
                })}
                disabled={isConverting}
              />
              Maintain Aspect Ratio
            </label>
          </div>
        </div>
        <div className="svg-conversion-buttons">
          <button
            className={`conversion-btn primary ${isConverting ? 'loading' : ''}`}
            onClick={onConvert}
            disabled={isConverting}
          >
            {isConverting ? (
              <>
                <div className="loading-spinner" />
                Converting...
              </>
            ) : (
              'Convert & Add'
            )}
          </button>
          <button
            className="conversion-btn cancel"
            onClick={onCancel}
            disabled={isConverting}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default SvgConversionModal;
