function UserAvatar({ user, className = "" }) {
  const initial = (user?.username || "U").slice(0, 1).toUpperCase();

  return (
    <span className={`user-profile-avatar ${className}`.trim()} aria-hidden="true">
      {user?.avatar ? <img src={user.avatar} alt="" /> : initial}
    </span>
  );
}

export default UserAvatar;
