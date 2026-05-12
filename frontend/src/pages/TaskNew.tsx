import PageHeader from "../components/layout/PageHeader";
import TaskForm from "../components/TaskForm";

export default function TaskNew() {
  return (
    <div>
      <PageHeader title="New entry" subtitle="Log hours and let AI polish the description." />
      <TaskForm />
    </div>
  );
}
