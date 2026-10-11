import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="bg-gray-100 py-4">
      <div className="mx-auto max-w-7xl px-4 text-center text-gray-600">
        &copy; {new Date().getFullYear()} VTicket. All rights reserved.
      </div>
    </footer>
  );
}

export default Footer;