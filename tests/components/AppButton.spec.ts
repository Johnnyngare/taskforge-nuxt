// tests/components/AppButton.spec.ts
import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import AppButton from "@/components/form/AppButton.vue";

describe("AppButton", () => {
  it("renders a button", () => {
    const wrapper = mount(AppButton);
    expect(wrapper.find("button").exists()).toBe(true);
  });

  it("renders the slot content", () => {
    const wrapper = mount(AppButton, {
      slots: {
        default: "Click Me",
      },
    });
    expect(wrapper.text()).toBe("Click Me");
  });
});
