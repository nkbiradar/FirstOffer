import { redirect } from "next/navigation";

// Public story submission is turned off — stories are added by the admin
// only (/admin/what-worked). Old links land on the read-only page.
export default function ShareWhatWorkedPage() {
  redirect("/what-worked");
}
