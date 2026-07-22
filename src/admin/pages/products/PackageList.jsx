import TypedProductList from "./TypedProductList"

export default function PackageList() {
  return (
    <TypedProductList
      type="package"
      newLabel="New Package"
      emptyMessage="No pricing packages yet — add one to show it in the homepage Packages & Pricing section."
    />
  )
}
