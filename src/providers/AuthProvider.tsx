"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "@/lib/axios";
import { useToast } from "@/components/ui/Toast";
import axios from "axios";
import { useGoogleLogin } from "@react-oauth/google";
// import jwt from "json-web-token"


interface AuthContextType {
  user: any | null;
  loading: boolean;
  register: (
    firstName: string,
    lastName: string,
    phone: string,
    email: string,
    password: string,
    role: string,
    companyName?: string
  ) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  GoogleLogin: () => void;
  GoogleSignUp: () => void;
  setRoleForGoogleSignUp: React.Dispatch<React.SetStateAction<string>>;

}
interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  role: string;
  provider: string;
  companyName?: string;
}


const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const { showToast } = useToast();
  const [user, setUser] = useState<any | null>(null);
  const [roleForGoogleSignUp, setRoleForGoogleSignUp] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const fetched = useRef(false);

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;

    const fetchUser = async () => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        const res = await axiosInstance.get(`/api/auth/check-login`, {
          signal: controller.signal,
        });
        console.log('check login response: ', res.data.user);
        setUser(res.data.user || null);
        clearTimeout(timeout)
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();

  }, []);

  // Conditional register function with optional extra field
  const register = async (
    firstName: string,
    lastName: string,
    phone: string,
    email: string,
    password: string,
    role: string,
    companyName?: string
  ): Promise<void> => {
    setLoading(true);
    try {
      const payload: RegisterPayload = {
        firstName,
        lastName,
        email,
        phone,
        password,
        role,
        provider: "email",
      };

      if (companyName) {
        payload.companyName = companyName;
      }
      let res;
      if (role === 'employer') {
        res = await axiosInstance.post("/api/employers", payload);
      } else if (role === 'candidate') {
        res = await axiosInstance.post("/api/candidates", payload);
      } else {
        throw new Error("Invalid role provided");
      }
      console.log('response candidate signup: ', res.data);

      if (res.status === 201 && res?.data) {
        setUser(res.data);
        router.push("/dashboard");
        showToast("success", "You registered successfully");
      } else {
        showToast("error", res.data?.message || "Registration failed");
      }
    } catch (error) {
      console.log(error);
      let errorMessage = "Registration failed";
      if (axios.isAxiosError(error)) {
        if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.response?.status === 400) {
          errorMessage = "Invalid registration data";
        } else if (error.response?.status === 409) {
          errorMessage = "Email already in use";
        } else if (error.response?.status && error.response.status >= 500) {
          errorMessage = "Server error. Please try again later.";
        }
        console.log("Axios error details:", {
          status: error.response?.status,
          data: error.response?.data,
          headers: error.response?.headers,
        });
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      showToast("error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Login function
  const login = async (email: string, password: string): Promise<void> => {
    setLoading(true);
    try {
      const res = await axiosInstance.post(`/api/auth/login`, { email, password });
      console.log(res.data);
      // assuming backend returns { user: {...}, token: '...' }
      setUser(res.data.user);
      router.push("/dashboard");
      showToast("success", "Logged in successfully");
      //setLoading(false);
    } catch (err) {
      console.error(err);
      let errorMessage = "Login failed";
      if (axios.isAxiosError(err)) {
        if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        } else if (err.response?.status === 400) {
          errorMessage = "Invalid credentials";
        } else if (err.response?.status === 401) {
          errorMessage = "Invalid email or password";
        } else if (err.response?.status && err.response.status >= 500) {
          errorMessage = "Server error. Please try again later.";
        }
        console.log("Axios error details:", {
          status: err.response?.status,
          data: err.response?.data,
          headers: err.response?.headers,
        });
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      showToast("error", errorMessage);
    } finally {
      setLoading(false);
    }
  };


  // Logout function
  const logout = async (): Promise<void> => {
    setLoading(true);
    try {
      const res = await axiosInstance.post('/api/auth/logout');

      if (res.status === 200) {
        setUser(null);

        // Small delay to ensure cookies are removed before redirecting
        setTimeout(() => {
          router.push("/login");
        }, 100);

        showToast("success", "Logged out successfully");
      }
    } catch (err) {
      console.error("Logout error:", err);
      let errorMessage = "Logout failed";
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      showToast("error", errorMessage);
    } finally {
      setLoading(false);
    }
  };
  // signup with google
  const googleSignUpHook = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setLoading(true);
        const { access_token } = tokenResponse;

        const { data: googleUser } = await axios.get(
          "https://www.googleapis.com/oauth2/v2/userinfo",
          {
            headers: { Authorization: `Bearer ${access_token}` },
          }
        );

        const [firstName, ...rest] = googleUser.name.split(" ");
        const lastName = rest.join(" ");
        console.log("Google user info:", googleUser);
        const res = await axiosInstance.post("/api/auth/google", {
          firstName,
          lastName,
          email: googleUser.email,
          profileImage: googleUser.picture,
          googleLogin: true,
          role: roleForGoogleSignUp,
        });

        if (res.status === 200 || res.status === 201) {
          setUser(res.data.user);
          router.push("/dashboard");
          showToast("success", "Logged in with Google successfully!");
        }
      } catch (err) {
        console.error(err);
        showToast("error", "Google login failed");
      } finally {
        setLoading(false);
      }
    },
    onError: () => showToast("error", "Google login failed"),
  });
  const GoogleSignUp = () => googleSignUpHook();

  // signup with google
  const googleLoginHook = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setLoading(true);
        const { access_token } = tokenResponse;

        const { data: googleUser } = await axios.get(
          "https://www.googleapis.com/oauth2/v2/userinfo",
          {
            headers: { Authorization: `Bearer ${access_token}` },
          }
        );

        const [firstName, ...rest] = googleUser.name.split(" ");
        const lastName = rest.join(" ");
        console.log("Google user info:", googleUser);
        const email = googleUser.email;
        const password = access_token; // Using access token as a dummy password
        const res = await axiosInstance.post(`/api/auth/login`, { email, password, googleLogin: true });
        console.log('login successfull', res.data);
        if (res.status === 200 || res.status === 201) {
          setUser(res.data.user);
          router.push("/dashboard");
          showToast("success", "Logged in with Google successfully!");
        }
      } catch (err) {
        console.error(err);
        showToast("error", "Google login failed");
      } finally {
        setLoading(false);
      }
    },
    onError: () => showToast("error", "Google login failed"),
  });
  const GoogleLogin = () => googleLoginHook();




  //  Create the context value with proper type
  const value: AuthContextType = {
    user,
    loading,
    register,
    login,
    logout,
    GoogleLogin,
    GoogleSignUp,
    setRoleForGoogleSignUp,
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
};

// Custom hook with proper type checking
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};



