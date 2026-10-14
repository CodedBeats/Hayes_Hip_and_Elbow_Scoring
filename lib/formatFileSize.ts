// eslint-disable-next-line -- referenced only via TSDoc {@link} for docs generation
import type { DicomPreviewCard } from '@/components/admin/DicomPreviewCard';
/**
 * formats file size in correct incremendted level of Bytes
 *
 * @remarks
 * This is only used for DICOM files specifically in {@link DicomPreviewCard}. 
 * The file size (in bytes) is measured from metadata rather than a stored value
 * 
 * It will be displayed like: `800 KB` or `20 MB` or `1 GB`
 */
export const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    const units = ["KB", "MB", "GB"];
    let value = bytes / 1024;
    let unitIndex = 0;
    while (value >= 1024 && unitIndex < units.length - 1) {
        value /= 1024;
        unitIndex += 1;
    }
    return `${value.toFixed(1)} ${units[unitIndex]}`;
};
