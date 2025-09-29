import React from "react";
import "../../styles/components/home/PolicyModal.css";

interface PolicyModalProps {
    isVisible: boolean;
    onClose: () => void;
    title: "Privacy Policy" | "Terms of Service" | "นโยบายความเป็นส่วนตัว" | "เงื่อนไขการใช้งาน";
}

const PolicyModal: React.FC<PolicyModalProps> = ({ isVisible, onClose, title }) => {
    if (!isVisible) return null;

    const contentMap: Record<string, string> = {
        "Privacy Policy": `
      We collect your data to enhance your experience. We do not share your personal data with third parties without consent.
      
      Information we collect may include your name, email address, and usage patterns. This data is securely stored and only used to improve our services.
      
      You have the right to request data deletion at any time. Contact us for more details.
    `,
        "Terms of Service": `
      By using our service, you agree to comply with our terms and conditions.
      
      Do not misuse our platform. This includes attempting to hack, extract, or reverse-engineer any part of our service.
      
      We reserve the right to terminate access to users who violate these terms.
    `,
        "นโยบายความเป็นส่วนตัว": `
      เราเก็บรวบรวมข้อมูลของคุณเพื่อปรับปรุงประสบการณ์การใช้งาน เราไม่เปิดเผยข้อมูลส่วนบุคคลของคุณให้กับบุคคลที่สามโดยไม่ได้รับความยินยอม
      
      ข้อมูลที่เราเก็บรวบรวมอาจรวมถึงชื่อ อีเมล และรูปแบบการใช้งาน ข้อมูลนี้จะถูกเก็บรักษาอย่างปลอดภัยและใช้เพื่อปรับปรุงบริการของเราเท่านั้น
      
      คุณมีสิทธิ์ขอให้ลบข้อมูลได้ตลอดเวลา ติดต่อเราเพื่อรายละเอียดเพิ่มเติม
    `,
        "เงื่อนไขการใช้งาน": `
      การใช้บริการของเราแสดงว่าคุณยอมรับที่จะปฏิบัติตามข้อกำหนดและเงื่อนไขของเรา
      
      ห้ามใช้แพลตฟอร์มของเราอย่างไม่เหมาะสม รวมถึงการพยายามแฮ็ก ดึงข้อมูล หรือวิศวกรรมย้อนกลับส่วนใดส่วนหนึ่งของบริการของเรา
      
      เราขอสงวนสิทธิ์ในการยกเลิกการเข้าถึงสำหรับผู้ใช้ที่ละเมิดเงื่อนไขเหล่านี้
    `
    };

    return (
        <div className="policy-modal-overlay">
            <div className="policy-modal">
                <button onClick={onClose} className="policy-close-button">×</button>
                <h2>{title}</h2>
                <div className="policy-content">
                    <p>{contentMap[title]}</p>
                </div>
            </div>
        </div>
    );
};

export default PolicyModal;
