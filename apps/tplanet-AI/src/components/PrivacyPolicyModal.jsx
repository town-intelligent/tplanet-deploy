// src/components/PrivacyPolicyModal.jsx
import { useState, useEffect } from "react";
import { Modal, Button, Form } from "react-bootstrap";

export default function PrivacyPolicyModal({ show, onClose, onAgree }) {
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (show) setChecked(false);
  }, [show]);

  return (
    <Modal show={show} onHide={onClose} size="lg" centered scrollable>
      <Modal.Header closeButton>
        <Modal.Title>隱私權聲明</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <div className="max-h-[60vh] overflow-y-auto space-y-4 leading-7">
          <p>非常歡迎您使用本網站，為了讓您能夠安心使用本網站所提供的服務與資訊，特此向您說明本網站的隱私權保護政策，以保障您的權益，請您詳閱下列內容：</p>

          <h5>一、隱私權保護政策的適用範圍</h5>
          <p>隱私權保護政策內容，包括本網站如何處理在您使用網站服務時收集到的個人識別資料。隱私權保護政策不適用於本網站以外的相關連結網站，也不適用於非本網站所委託或參與管理的人員。</p>

          <h5>二、個人資料的蒐集、處理及利用方式</h5>
          <p>當您造訪本網站或使用本網站所提供之功能服務時，我們將視該服務功能性質，請您提供必要的個人資料，並在該特定目的範圍內處理及利用您的個人資料；非經您書面同意，本網站不會將個人資料用於其他用途。</p>
          <p>本網站在您使用服務信箱、問卷調查等互動性功能時，會保留您所提供的姓名、電子郵件地址、聯絡方式及使用時間等。</p>
          <p>於一般瀏覽時，伺服器會自行記錄相關行徑，包括您使用連線設備的IP位址、使用時間、使用的瀏覽器、瀏覽及點選資料記錄等，做為我們增進網站服務的參考依據，此記錄為內部應用，決不對外公佈。</p>
          <p>為提供精確的服務，我們會將收集的問卷調查內容進行統計與分析，分析結果之統計數據或說明文字呈現，除供內部研究外，我們會視需要公佈統計數據及說明文字，但不涉及特定個人之資料。</p>
          <p>您可以隨時向我們提出請求，以更正或刪除本網站所蒐集您錯誤或不完整的個人資料。</p>

          <h5>三、資料之保護</h5>
          <p>本網站主機均設有防火牆、防毒系統等相關資訊安全設備及必要的安全防護措施…（以下略同你提供的全文）</p>

          <h5>四、網站對外的相關連結</h5>
          <p>本網站的網頁提供其他網站的網路連結…</p>

          <h5>五、與第三人共用個人資料之政策</h5>
          <p>本網站絕不會提供、交換、出租或出售任何您的個人資料…（含但書各點）</p>

          <h5>六、Cookie之使用</h5>
          <p>為了提供您最佳的服務，本網站會在您的電腦中放置並取用我們的Cookie…</p>

          <h5>七、隱私權保護政策之修正</h5>
          <p>本網站隱私權保護政策將因應需求隨時進行修正，修正後的條款將刊登於網站上。</p>
        </div>

        <Form.Check
          className="mt-4"
          type="checkbox"
          id="agree-privacy"
          label="我已閱讀並同意隱私權條款"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
        />
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          取消
        </Button>
        <Button variant="dark" onClick={() => onAgree()} disabled={!checked}>
          同意並繼續
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

