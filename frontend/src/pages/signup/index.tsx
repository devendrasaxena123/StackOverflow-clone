import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/lib/AuthContext";
import { useState } from "react";
import { useRouter } from "next/router";
import { toast } from "react-toastify";

export default function SignUpPage() {
  const router = useRouter();
  const { Signup, loading } = useAuth();
  const [form, setform] = useState({ name: "", email: "", phone: "", password: "" });

  const handleChange = (e: any) => {
    setform({ ...form, [e.target.id]: e.target.value });
  };

  const handlesubmit = async (e: any) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      toast.error("Name, email, and password are required.");
      return;
    }
    try {
      await Signup(form);
      router.push("/");
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6 lg:mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="text-3xl">🥞</span>
            <span className="text-2xl font-bold tracking-tight text-gray-900">
              stack<span className="text-[#ef8236]">overflow</span>
            </span>
          </Link>
        </div>
        <form onSubmit={handlesubmit}>
          <Card className="rounded-2xl shadow-xl border-gray-100">
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="text-xl lg:text-2xl font-bold">
                Create your account
              </CardTitle>
              <CardDescription className="text-xs">
                Join the Stack Overflow developer community
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs font-semibold">
                  Display name
                </Label>
                <Input
                  id="name"
                  placeholder="e.g. John Doe"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-xs font-semibold">
                  Phone Number (optional, for SMS authentication)
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="9876543210"
                  value={form.phone}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-semibold">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  required
                />
                <p className="text-[11px] text-gray-500">
                  Passwords must be at least 6 characters.
                </p>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold text-sm rounded-xl py-2.5 transition"
              >
                {loading ? "Creating Account..." : "Sign up"}
              </Button>

              <div className="text-center text-xs text-gray-500 pt-2 border-t border-gray-100">
                Already have an account?{" "}
                <Link href="/auth" className="text-orange-600 font-bold hover:underline">
                  Log in
                </Link>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}
