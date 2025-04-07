import Image from "next/image";
import { FC, useState } from "react";
// import "./style.scss";
import { useRouter } from "next/navigation";

interface Props {
  onClose: () => void;
}
const RescueSuccessfulDialog: FC<Props> = ({ onClose }) => {

  return (
    <div className="dialog" onClick={onClose}>
      <div
        className="panel-donate rescue"
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <div className="panel-inner rescue">
          <h2>Request Submitted</h2>
          <Image
            className="foot-1"
            src="/foot-1.svg"
            width={85}
            height={85}
            alt="foot"
          ></Image>
          <Image
            className="foot-2"
            src="/foot-2.svg"
            width={85}
            height={85}
            alt="foot"
          ></Image>
          <Image
            className="foot-3"
            src="/foot-3.svg"
            width={85}
            height={85}
            alt="foot"
          ></Image>
          <Image
            className="foot-4"
            src="/foot-3.svg"
            width={85}
            height={85}
            alt="foot"
          ></Image>
          <div className="text rescue-successful">
            <p>Thank you for your passion for animal rescue efforts. </p>
            <p>
              Broccoli is committed to leveraging blockchain technology and the
              cultural power of the meme community to bring more care and
              compassion to the world.
            </p>
            <p>
              Your application will be reviewed and voted on by the community.
              Our dedicated team will keep you updated on the progress via
              X/Telegram. Please ensure your contact information is accessible.
            </p>
          </div>
          <button
            type="button"
            className="confirm-btn confirm-donate"
            onClick={onClose}
          >
            <span>Done</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default RescueSuccessfulDialog;
