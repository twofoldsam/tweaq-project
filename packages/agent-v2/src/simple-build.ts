// Simple build test to verify basic compilation
export interface SimpleTest {
  message: string;
}

export function createSimpleTest(): SimpleTest {
  return {
    message: "Agent V2 architecture is working!"
  };
}

export default createSimpleTest;
