fn main() {
    // Tell cargo to look for shared libraries in the ../build directory
    println!("cargo:rustc-link-search=native=../build");
    // Link to libappleai.dylib (lib prefix stripped)
    println!("cargo:rustc-link-lib=dylib=appleai");

    // macOS: Embed @loader_path so the .node finds the dylib next to it
    #[cfg(target_os = "macos")]
    {
        // Add rpath so dylib is found next to .node
        println!("cargo:rustc-link-arg=-Wl,-rpath,@loader_path");
        // Allow unresolved Node-API symbols to be resolved at runtime by Node/Bun
        println!("cargo:rustc-link-arg=-undefined");
        println!("cargo:rustc-link-arg=dynamic_lookup");
    }
}
