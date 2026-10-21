import { IoChevronBack, IoChevronForward } from "react-icons/io5";
import { useBreakpoint } from "../theme";

// Reusable Previous/Next pagination bar. Compact on phones, roomier
// on tablet/desktop. Hidden automatically when there's only one page.
export default function Pagination({ currentPage, totalPages, onPrev, onNext }) {
  const compact = useBreakpoint() === "phone";

  if (totalPages <= 1) return null;

  return (
    <div className={`pagination-bar ${compact ? "compact" : ""}`}>
      <button
        type="button"
        className="pagination-btn"
        onClick={onPrev}
        disabled={currentPage === 1}
      >
        <IoChevronBack size={compact ? 16 : 18} />
        Previous
      </button>

      <span className="pagination-page-text">
        Page {currentPage} of {totalPages}
      </span>

      <button
        type="button"
        className="pagination-btn"
        onClick={onNext}
        disabled={currentPage === totalPages}
      >
        Next
        <IoChevronForward size={compact ? 16 : 18} />
      </button>
    </div>
  );
}
