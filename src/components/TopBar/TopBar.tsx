import Image from "next/image";

const TopBar = () => {
  return (
    <div className="flex flex-row justify-between items-center w-full">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={180}
          height={38}
          priority
        />
        <nav>
          <a href="/">Home</a>
        </nav>
        <div>User</div>
      </div>
  );
};

export default TopBar;