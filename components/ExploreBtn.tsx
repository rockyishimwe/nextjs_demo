/* eslint-disable @next/next/no-img-element */
import Link from "next/link";

const ExploreBtn = () => {
  return (
    <Link
      href="#events"
      id="explore-btn"
      className="mt-7 mx-auto border-dark-200 bg-dark-100 flex w-fit cursor-pointer rounded-full border px-8 py-3.5 max-sm:w-full text-center no-underline"
    >
      <span className="flex-center gap-2 text-center w-full">
        Explore Events
        <img src="/icons/arrow-down.svg" alt="arrow-down" width={20} height={20} />
      </span>
    </Link>
  );
};

export default ExploreBtn;
