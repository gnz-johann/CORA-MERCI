import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function InputField({
  icon: Icon,
  type = "text",
  placeholder,
  value,
  onChange,
  name,
  autoComplete,
}) {
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = type === "password";

  return (
    <div className="relative">

      <Icon
        size={18}
        className="
          absolute left-4 top-1/2 -translate-y-1/2
          text-[#777DA1] peer-focus:text-[#156BE7]
          transition-colors duration-300
        "
      />

      <input
        type={isPassword ? (showPassword ? "text" : "password") : type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        name={name}
        autoComplete={autoComplete}
        className="
          peer
          w-full h-[37px]
          pl-11 pr-11
          rounded-[10px]
          border-2 border-[#252942]
          bg-transparent
          outline-none
          text-white text-[14px] font-medium font-montserrat
          placeholder:text-[#777DA1] placeholder:opacity-75
          focus:border-[#156BE7]
          transition-all duration-300
        "
      />

      {isPassword && (
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="
            absolute right-4 top-1/2 -translate-y-1/2
            text-[#777DA1] hover:text-[#156BE7]
            transition-colors
          "
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      )}

    </div>
  );
}
