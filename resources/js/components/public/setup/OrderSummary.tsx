import React from "react";
import { useLang } from '@/hooks/useLang'

type Props = {
  planName?: string;
  price: number;
  coupon: string;
  onCouponChange: (v: string) => void;
  onApplyCoupon: () => void;
  discount: number;
  total: number;
};

export default function OrderSummary({
  planName, price, coupon, onCouponChange, onApplyCoupon,
  discount, total,
}: Props) {
  const { __ } = useLang()
  // order summary card
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow sm:p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-start text-base font-bold text-slate-900 sm:text-lg">{__("messages.setup.order.summary_title")}</h2>

        {/* coupon input with apply button */}
        <div className="relative w-56 max-w-full">
          <input
            value={coupon}
            onChange={(e) => onCouponChange(e.target.value)}
            placeholder={__("messages.setup.order.coupon_placeholder")}
            className="w-full rounded-lg border text-right border-slate-300 bg-[#EDEDED] px-3 py-2 text-sm focus:border-public-active focus:outline-none"
          />
          <button
            type="button"
            onClick={onApplyCoupon}
            className="absolute inset-y-0 left-0 my-1 ml-1 rounded-md bg-public-primary px-3 text-sm font-semibold text-white hover:opacity-90"
          >
            {__("messages.setup.order.apply_button")}
          </button>
        </div>
      </div>

      <div className="space-y-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-start text-slate-600">{__("messages.setup.order.plan_name")}</span>
          <span className="text-end font-semibold">{planName ?? "—"}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-start text-slate-600">{__("messages.setup.order.price")}</span>
          <span className="text-end font-semibold">{price.toLocaleString("en-US")} {__("messages.common.currency")}</span>
        </div>

        {discount > 0 && (
          <div className="flex items-center justify-between text-emerald-700">
            <span className="text-start">– {__("messages.setup.order.coupon_label")}</span>
            <span className="text-end">– {discount.toLocaleString("en-US")} {__("messages.common.currency")}</span>
          </div>
        )}

        <div className="my-2 h-px w-full bg-black" />

        <div className="flex items-center justify-between">
          <span className="text-start font-bold text-slate-900">{__("messages.setup.order.total_label")}</span>
          <span className="text-end font-extrabold">{total.toLocaleString("en-US")} {__("messages.common.currency")}</span>
        </div>
      </div>
    </div>
  );
}
