require 'sxp'

module LHTM
  class Parser
    def initialize(options={})
      @options = options
    end
    def call(blob)
      # remove comments, strip and desugar doctype
      templeize SXP.read_all(blob.strip
        .split("\n")
        .map { |x| x.gsub(/#{@comment_char}+.*/, '') }
        .select { |x| x != ''}
        .join("\n")
        .sub(/#doctype (.+)/, '(\!DOCTYPE \\1)'))
    end
    private
    def templeize(arr)
      res = [:multi]
      arr.each do |elem|
        if elem.class == Array
          res << templeize elem
        end

      end
    end
  end
end
