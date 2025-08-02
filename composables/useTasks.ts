// file: composables/useTasks.ts
import { ref } from "vue"; // Make sure ref is imported

export const useTasks = async () => {
  // Make it async
  const data = ref([]);
  const pending = ref(true); // Default to true while fetching
  const error = ref(null);

  const fetchData = async () => {
    pending.value = true;
    error.value = null;
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate delay
      data.value = [
        // ... your mock task data ...
        {
          id: 1,
          title: "Learn Nuxt 3 Composables",
          description: "Deep dive into useAsyncData and useFetch.",
          priority: "High",
          dueDate: "2025-08-10",
          completed: false,
        },
        {
          id: 2,
          title: "Set up Tailwind Dark Mode",
          description: "Integrate @nuxtjs/color-mode.",
          priority: "Medium",
          dueDate: "2025-08-05",
          completed: true,
        },
        {
          id: 3,
          title: "Refactor TaskCard component",
          description: "Add more details and actions.",
          priority: "Low",
          dueDate: "2025-08-15",
          completed: false,
        },
        {
          id: 4,
          title: "Create login page UI",
          description: "Design form and integrate auth composable.",
          priority: "High",
          dueDate: "2025-08-03",
          completed: false,
        },
        {
          id: 5,
          title: "Implement search functionality",
          description: "Add search bar to header and filter tasks.",
          priority: "Medium",
          dueDate: "2025-08-20",
          completed: false,
        },
      ];
    } catch (e) {
      error.value = e;
      data.value = [];
    } finally {
      pending.value = false;
    }
  };

  // *** THIS IS THE CRUCIAL CHANGE: Call fetchData immediately ***
  await fetchData(); // Await the initial fetch

  return {
    data,
    pending,
    error,
    refreshData: fetchData, // Rename to refreshData for clarity, as it's not just fetching initially
  };
};
