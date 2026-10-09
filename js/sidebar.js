
document.addEventListener("DOMContentLoaded", () => {
  const sidebar = document.querySelector(".sidebar");
  const toggle = document.querySelector("#sidebarToggle");
  const close = document.querySelector("#sidebarCloseBtn");
  const backdrop = document.querySelector("#sidebarBackdrop");

  if (!sidebar || !toggle || !close || !backdrop) return;

  const setOpen = (open) => {
    document.body.classList.toggle("sidebar-open", open);
    toggle.setAttribute("aria-expanded", String(open));
  };

  toggle.addEventListener("click", () =>
    setOpen(!document.body.classList.contains("sidebar-open"))
  );
  close.addEventListener("click", () => setOpen(false));
  backdrop.addEventListener("click", () => setOpen(false));
  sidebar.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => setOpen(false))
  );
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setOpen(false);
  });
});
